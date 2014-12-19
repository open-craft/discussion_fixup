var from_ORG = 'Dev';
var to_ORG = 'AcademyMMP';
 
var course_num = 'MAPS';
 
print("Running....");
 
 
var missing_discussion_ids = db.modulestore
    .find({'_id.org':to_ORG, '_id.course':course_num, '_id.category':'discussion-forum', 'metadata.discussion_id': {$exists:false}})
    .map(function (doc) { return doc._id.name;});
 
var dmap = db.modulestore
.find({'_id.org':from_ORG, '_id.course':course_num, '_id.name': {$in: missing_discussion_ids}, 'metadata.discussion_id': {$exists:true}})
.map(function(doc) {
    return {name: doc._id.name, discussion_id: doc.metadata.discussion_id};
});
 
for (var i=0; i < dmap.length; i++) {
    var discussion = dmap[i];
    print("Fixing discussion id for " + discussion.name + ": Setting discussion_id to " + discussion.discussion_id);
    /*
        db.modulestore.update(
                {"_id.org": to_ORG, "_id.course":course_num, "_id.name": discussion.name, "_id.revision": null},
                {$set: {'metadata.discussion_id': discussion.discussion_id}}
    )
 
    db.modulestore.update(
                {"_id.org": to_ORG, "_id.course":course_num, "_id.name": discussion.name, "_id.revision": "draft"},
                {$set: {'metadata.discussion_id': discussion.discussion_id}}
 
   */
}
print("Success. Updated " + dmap.length + " documents!");
print(missing_discussion_ids.length + " original documents missing discussion_id");
