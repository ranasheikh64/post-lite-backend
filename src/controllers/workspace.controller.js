const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

exports.createWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.create({
      name: req.body.name,
      owner: req.user.id,
      members: [] // owner is implicitly the owner, no need to add to members array
    });
    res.status(201).json(workspace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    }).populate('owner', 'name email').populate('members.user', 'name email').lean();
    
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = req.params.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Check if user is owner or admin
    const isOwner = workspace.owner.toString() === req.user.id;
    const adminMember = workspace.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');
    if (!isOwner && !adminMember) {
      return res.status(403).json({ message: 'Only owner or admin can add members' });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with this email' });

    if (workspace.owner.toString() === userToAdd._id.toString()) {
      return res.status(400).json({ message: 'User is already the owner' });
    }

    const existingMember = workspace.members.find(m => m.user.toString() === userToAdd._id.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    workspace.members.push({ user: userToAdd._id, role: role || 'viewer' });
    await workspace.save();
    
    const updatedWorkspace = await Workspace.findById(workspaceId).populate('owner', 'name email').populate('members.user', 'name email');
    res.json(updatedWorkspace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = req.params.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Ensure inviter has permission
    const isOwner = workspace.owner.toString() === req.user.id;
    const adminMember = workspace.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');
    if (!isOwner && !adminMember) {
      return res.status(403).json({ message: 'Only owner or admin can invite members' });
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (workspace.owner.toString() === existingUser._id.toString()) {
        return res.status(400).json({ message: 'User is already the owner' });
      }
      const existingMember = workspace.members.find(m => m.user.toString() === existingUser._id.toString());
      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member' });
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Invitation.create({
      email,
      workspaceId,
      role: role || 'viewer',
      token,
      invitedBy: req.user.id,
      expiresAt
    });

    const inviteLink = `https://ranasheikh64.github.io/Post-Lite/#/invite?token=${token}`;
    
    const mailOptions = {
      from: `"Jronix Post" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `You've been invited to join ${workspace.name} on Jronix Post`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Workspace Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to join the <strong>${workspace.name}</strong> workspace on Jronix Post.</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #F97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Accept Invitation</a>
          <p>Or copy this link: <a href="${inviteLink}">${inviteLink}</a></p>
          <p>This link will expire in 7 days.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Invitation sent successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    
    const invite = await Invitation.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!invite) return res.status(400).json({ message: 'Invalid or expired invitation token' });

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace no longer exists' });

    // The user calling this endpoint is the authenticated user that clicked accept
    // We double check if they are already in
    const existingMember = workspace.members.find(m => m.user.toString() === req.user.id);
    if (!existingMember && workspace.owner.toString() !== req.user.id) {
      workspace.members.push({ user: req.user.id, role: invite.role });
      await workspace.save();
    }

    // Delete the invite since it's used
    await Invitation.findByIdAndDelete(invite._id);

    res.json({ message: 'Successfully joined workspace', workspaceId: workspace._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id: workspaceId, userId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isOwner = workspace.owner.toString() === req.user.id;
    const adminMember = workspace.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');
    if (!isOwner && !adminMember) {
      return res.status(403).json({ message: 'Only owner or admin can update roles' });
    }

    const member = workspace.members.find(m => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found in workspace' });

    member.role = role;
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspaceId).populate('owner', 'name email').populate('members.user', 'name email');
    res.json(updatedWorkspace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id: workspaceId, userId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isOwner = workspace.owner.toString() === req.user.id;
    const adminMember = workspace.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');
    
    // User can remove themselves, otherwise must be owner or admin
    if (req.user.id !== userId && !isOwner && !adminMember) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== userId);
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspaceId).populate('owner', 'name email').populate('members.user', 'name email');
    res.json(updatedWorkspace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete the team' });
    }

    const Collection = require('../models/Collection');
    const Request = require('../models/Request');
    
    const collections = await Collection.find({ workspace: workspaceId });
    const collectionIds = collections.map(c => c._id);
    
    await Request.deleteMany({ collectionId: { $in: collectionIds } });
    await Collection.deleteMany({ workspace: workspaceId });
    
    await Workspace.findByIdAndDelete(workspaceId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
