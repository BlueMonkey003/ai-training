// MongoDB Migration Script: Add isActive field to all users
// Run this directly in MongoDB Atlas, Compass, or mongosh

// IMPORTANT: Change database name based on environment
use lunchmonkeys - prod;  // For production
// use lunchmonkeys;    // For development

print("========================================");
print("   User isActive Field Migration");
print("========================================");

// Step 1: Backup check (show sample of current data)
print("\n📋 Current user schema sample:");
db.users.findOne({}, { name: 1, email: 1, role: 1, isActive: 1 });

// Step 2: Count users without isActive
var countBefore = db.users.countDocuments({ isActive: { $exists: false } });
print("\n📊 Users without isActive field: " + countBefore);

if (countBefore === 0) {
    print("✅ All users already have isActive field. No migration needed.");
} else {
    // Step 3: Create index for better performance (if many users)
    print("\n🔧 Creating index for isActive field...");
    db.users.createIndex({ isActive: 1 });

    // Step 4: Update users
    print("\n🔄 Updating users...");
    var updateResult = db.users.updateMany(
        { isActive: { $exists: false } },
        {
            $set: {
                isActive: true,
                updatedAt: new Date()
            }
        }
    );

    print("✅ Modified " + updateResult.modifiedCount + " documents");

    // Step 5: Verify update
    var countAfter = db.users.countDocuments({ isActive: { $exists: false } });
    print("\n✅ Verification: Users without isActive field after update: " + countAfter);
}

// Step 6: Final statistics
print("\n📊 Final Statistics:");
print("├─ Total users: " + db.users.countDocuments());
print("├─ Active users: " + db.users.countDocuments({ isActive: true }));
print("├─ Inactive users: " + db.users.countDocuments({ isActive: false }));
print("├─ Admin users: " + db.users.countDocuments({ role: "admin" }));
print("└─ Employee users: " + db.users.countDocuments({ role: "employee" }));

// Step 7: Show sample of updated data
print("\n📋 Sample users after migration:");
db.users.find({}, { name: 1, email: 1, role: 1, isActive: 1 }).limit(5).forEach(function (user) {
    print("├─ " + user.name + " (" + user.email + ")");
    print("│  └─ Role: " + user.role + ", Active: " + user.isActive);
});

print("\n✅ Migration completed successfully!");
print("========================================");
