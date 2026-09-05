const Workspace = require('../models/Workspace');
const User = require('../models/User');

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
