const RequestModel = require('../models/Request');
const Collection = require('../models/Collection');

exports.sync = async (req, res) => {
  try {
    const { lastSyncedAt, pendingChanges } = req.body;

    // 1. Apply incoming local changes (last-write-wins by updatedAt)
    if (pendingChanges && pendingChanges.length > 0) {
      for (const change of pendingChanges) {
        const { entityType, id, data, updatedAt } = change;
        const Model = entityType === 'request' ? RequestModel : Collection;
        
        // Remove _id from data if present to avoid Mongo conflicts on upsert
        if (data._id) delete data._id;

        const existing = await Model.findById(id);

        if (!existing || new Date(updatedAt) >= existing.updatedAt) {
          await Model.findByIdAndUpdate(id, data, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
      }
    }

    // 2. Return everything server-side that changed since lastSyncedAt
    const query = lastSyncedAt ? { updatedAt: { $gt: new Date(lastSyncedAt) } } : {};
    const serverRequests = await RequestModel.find(query);
    const serverCollections = await Collection.find(query);

    res.json({
      serverChanges: { requests: serverRequests, collections: serverCollections },
      syncedAt: new Date(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
