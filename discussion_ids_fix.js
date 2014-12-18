var edxapp_backup_db = 'edxapp_backup';

var missing_discussion_ids = db.modulestore
    .find({'_id.category':'discussion-forum', 'metadata.discussion_id': {$exists:false}})
    .map(function (doc) { return doc._id;});

var dmap = db.getSiblingDB(edxapp_backup_db).modulestore
.find({_id: {$in: missing_discussion_ids}, 'metadata.discussion_id': {$exists:true}})
.map(function(doc) { 
    return {_id: doc._id, discussion_id: doc.metadata.discussion_id}; 
});

for (var i=0; i < dmap.length; i++) {
    var discussion = dmap[i];
    print("Fixing discussion id for ");
    printjsononeline(discussion._id);
    print("Setting discussion_id to " + discussion.discussion_id);
    db.modulestore.update(
        {_id: discussion._id},
        {$set: {'metadata.discussion_id': discussion.discussion_id}}
    )
    print("Success");
}