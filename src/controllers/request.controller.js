const RequestModel = require('../models/Request');

exports.createRequest = async (req, res) => {
  try {
    const request = await RequestModel.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getRequestsByCollection = async (req, res) => {
  try {
    const requests = await RequestModel.find({ collectionId: req.params.collectionId });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reorderRequests = async (req, res) => {
  try {
    const { requestIds } = req.body; // Expect an array of request IDs in the new order
    if (!Array.isArray(requestIds)) {
      return res.status(400).json({ message: 'requestIds must be an array' });
    }

    const updates = requestIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index } }
      }
    }));

    if (updates.length > 0) {
      await RequestModel.bulkWrite(updates);
    }

    res.status(200).json({ message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const updated = await RequestModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    await RequestModel.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveResponse = async (req, res) => {
  try {
    const { name, status, data, time, size } = req.body;
    const newResponse = {
      name,
      status,
      data,
      time,
      size
    };
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      req.params.id,
      { $push: { savedResponses: newResponse } },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.status(201).json(updatedRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteResponse = async (req, res) => {
  try {
    const { id, responseId } = req.params;
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      id,
      { $pull: { savedResponses: { _id: responseId } } },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.status(200).json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
