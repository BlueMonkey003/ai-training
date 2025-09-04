// MongoDB Rollback Script: Remove isActive field
// ONLY use this if you need to rollback the migration

use lunchmonkeys - prod;  // Change to your database

print("========================================");
print("   ROLLBACK: Remove isActive Field");
print("========================================");
print("⚠️  WARNING: This will remove the isActive field from all users!");
print("");

// Show current state
var totalUsers = db.users.countDocuments();
var usersWithIsActive = db.users.countDocuments({ isActive: { $exists: true } });

print("Current state:");
print("- Total users: " + totalUsers);
print("- Users with isActive field: " + usersWithIsActive);

// Safety check - uncomment the line below to actually perform rollback
// REMOVE THIS LINE TO EXECUTE ROLLBACK
print("\n❌ SAFETY: Rollback not executed. Remove safety check in script to proceed.");
/* 

// UNCOMMENT BELOW TO EXECUTE ROLLBACK

print("\n🔄 Removing isActive field from all users...");

var result = db.users.updateMany(
    {},
    { 
        $unset: { isActive: "" },
        $set: { updatedAt: new Date() }
    }
);

print("✅ Modified " + result.modifiedCount + " documents");

// Verify rollback
var remaining = db.users.countDocuments({ isActive: { $exists: true } });
print("\n✅ Users with isActive field after rollback: " + remaining);

// Remove index if it exists
print("\n🔧 Removing isActive index...");
try {
    db.users.dropIndex({ isActive: 1 });
    print("✅ Index removed");
} catch(e) {
    print("ℹ️  No isActive index found");
}

*/

print("\n========================================");
