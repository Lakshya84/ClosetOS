require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Item = require('./models/Item');

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/closetos');
    console.log('Connected.');

    // 1. Wipe database to ensure a clean state
    console.log('Clearing existing test data...');
    await User.deleteMany({});
    await Item.deleteMany({});
    console.log('Database wiped.');

    // 2. Create high-end mock user
    console.log('Creating mock creator profile...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    const mockUser = await User.create({
      email: 'creator@closet.os',
      displayName: 'Sophia Vance',
      passwordHash
    });
    console.log(`Creator Sophia Vance registered (User ID: ${mockUser._id}).`);

    // 3. Prepare high-end creator accessories mock data
    console.log('Pre-loading premium accessories...');
    
    // Monospace date shifts for testing overdue states
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const tenDaysFuture = new Date();
    tenDaysFuture.setDate(tenDaysFuture.getDate() + 10);

    const mockItems = [
      {
        owner: mockUser._id,
        name: 'Classic Cagole XS Shoulder Bag',
        brand: 'Balenciaga',
        category: 'Bag',
        status: 'IN_CLOSET',
        purchasePrice: 2200,
        tags: ['leather', 'grail', 'silver-hardware'],
        coverImageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        notes: 'Mint condition. Stored with dust bag.'
      },
      {
        owner: mockUser._id,
        name: 'Soap Dropper Metal Sunglasses',
        brand: 'Chrome Hearts',
        category: 'Sunglasses',
        status: 'ON_LOAN',
        custodianName: 'Jacob Elordi',
        custodianContact: '@jacobelordi',
        returnDate: twoDaysAgo, // Past expected return -> will trigger Overdue Tray!
        purchasePrice: 950,
        tags: ['silver', 'grail', 'eyewear'],
        coverImageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
        notes: 'Lent out for photoshoot. Jacob loves the silver decals.',
        loanLog: [
          {
            toStatus: 'ON_LOAN',
            recipientName: 'Jacob Elordi',
            recipientContact: '@jacobelordi',
            transferredAt: fiveDaysAgo,
            expectedReturn: twoDaysAgo
          }
        ]
      },
      {
        owner: mockUser._id,
        name: 'Oyster Perpetual 36 Yellow Dial',
        brand: 'Rolex',
        category: 'Watch',
        status: 'SENT_TO_STYLIST',
        custodianName: 'Stylist Sophia',
        custodianContact: '@sophiastylist',
        returnDate: tenDaysFuture, // Future expected return -> regular active loan
        purchasePrice: 6100,
        tags: ['luxury', 'steel', 'grail'],
        coverImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        notes: 'Lent for Met Gala prep.',
        loanLog: [
          {
            toStatus: 'SENT_TO_STYLIST',
            recipientName: 'Stylist Sophia',
            recipientContact: '@sophiastylist',
            transferredAt: oneDayAgo,
            expectedReturn: tenDaysFuture
          }
        ]
      },
      {
        owner: mockUser._id,
        name: 'Orb Pendant Relief Necklace',
        brand: 'Vivienne Westwood',
        category: 'Jewellery',
        status: 'IN_CLOSET',
        purchasePrice: 180,
        tags: ['silver', 'punk', 'jewels'],
        coverImageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
        notes: 'Classic orb necklace.'
      },
      {
        owner: mockUser._id,
        name: 'Split-Toe Tabi Leather Boots',
        brand: 'Maison Margiela',
        category: 'Shoes',
        status: 'MISSING', // Locked missing state
        purchasePrice: 990,
        tags: ['leather', 'avant-garde', 'tabi'],
        coverImageUrl: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=600&q=80',
        notes: 'Declared missing after Paris Fashion Week return shipment got scrambled.',
        loanLog: [
          {
            toStatus: 'ON_LOAN',
            recipientName: 'DHL Shipping',
            recipientContact: 'Tracking# 18273928',
            transferredAt: fiveDaysAgo,
            expectedReturn: twoDaysAgo,
            actualReturn: new Date()
          },
          {
            toStatus: 'MISSING',
            transferredAt: new Date()
          }
        ]
      }
    ];

    await Item.insertMany(mockItems);
    console.log('Pre-loaded 5 premium accessories successfully.');
    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULY!');
    console.log('You can now log in using the credentials below:');
    console.log('📧 Email: creator@closet.os');
    console.log('🔑 Password: password123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
