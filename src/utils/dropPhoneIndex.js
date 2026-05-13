/**
 * ONE-TIME MIGRATION SCRIPT
 * Run once: node src/utils/dropPhoneIndex.js
 *
 * Drops the old global unique index on `phone` and ensures the
 * new composite unique index { phone + ownerId } is in place.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const col = Customer.collection;
  const indexes = await col.indexes();

  // Drop old global unique index if it still exists
  const oldIndex = indexes.find(
    (i) => i.key && i.key.phone === 1 && !i.key.ownerId
  );
  if (oldIndex) {
    await col.dropIndex(oldIndex.name);
    console.log(`Dropped old index: ${oldIndex.name}`);
  } else {
    console.log('Old phone_1 index not found – skipping drop.');
  }

  // Ensure the new composite index exists
  await col.createIndex({ phone: 1, ownerId: 1 }, { unique: true });
  console.log('Composite index { phone, ownerId } ensured.');

  await mongoose.disconnect();
  console.log('Done.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
