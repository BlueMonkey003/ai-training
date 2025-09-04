// MongoDB Verification Script: Check user data integrity
// Run this to verify your users collection

use lunchmonkeys - prod;  // Change to your database

print("========================================");
print("   User Collection Verification");
print("========================================");

// Check for users with missing required fields
print("\n🔍 Checking data integrity...\n");

// Users without name
var noName = db.users.countDocuments({ name: { $exists: false } });
if (noName > 0) {
    print("⚠️  Users without name: " + noName);
}

// Users without email
var noEmail = db.users.countDocuments({ email: { $exists: false } });
if (noEmail > 0) {
    print("⚠️  Users without email: " + noEmail);
}

// Users without role
var noRole = db.users.countDocuments({ role: { $exists: false } });
if (noRole > 0) {
    print("⚠️  Users without role: " + noRole);
}

// Users without isActive
var noIsActive = db.users.countDocuments({ isActive: { $exists: false } });
if (noIsActive > 0) {
    print("⚠️  Users without isActive: " + noIsActive);
}

// Users with invalid role
var invalidRole = db.users.countDocuments({
    role: { $nin: ["admin", "employee"] }
});
if (invalidRole > 0) {
    print("⚠️  Users with invalid role: " + invalidRole);
}

// Check for duplicate emails
print("\n🔍 Checking for duplicate emails...");
var duplicates = db.users.aggregate([
    { $group: { _id: "$email", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
]).toArray();

if (duplicates.length > 0) {
    print("⚠️  Found " + duplicates.length + " duplicate emails:");
    duplicates.forEach(function (dup) {
        print("   - " + dup._id + " (appears " + dup.count + " times)");
    });
} else {
    print("✅ No duplicate emails found");
}

// Summary statistics
print("\n📊 User Statistics:");
print("├─ Total users: " + db.users.countDocuments());
print("├─ Active users: " + db.users.countDocuments({ isActive: true }));
print("├─ Inactive users: " + db.users.countDocuments({ isActive: false }));
print("├─ Admins: " + db.users.countDocuments({ role: "admin" }));
print("├─ Employees: " + db.users.countDocuments({ role: "employee" }));
print("└─ Users with profile image: " + db.users.countDocuments({
    profileImageUrl: { $exists: true, $ne: null }
}));

// Check indexes
print("\n🔧 Indexes on users collection:");
db.users.getIndexes().forEach(function (index) {
    print("├─ " + JSON.stringify(index.key));
});

print("\n✅ Verification complete!");
print("========================================");
