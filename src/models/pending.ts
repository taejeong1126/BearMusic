import mongoose from 'mongoose';

export default mongoose.model(
    'pendingqueues',
    new mongoose.Schema({
        identifier: { type: String, required: true },
        trackId: { type: String, required: true }
    })
);
