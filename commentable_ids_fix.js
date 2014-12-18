var edxapp_db = 'edxapp';

var usage_ids = db.getSiblingDB(edxapp_db).modulestore
.find({'_id.category':'discussion-forum', 'metadata.discussion_id': {$exists: true}})
.map(function(doc) { 
    return {usage_id: doc._id.name, discussion_id: doc.metadata.discussion_id}; 
});

for (var i = 0; i < usage_ids.length; i++) {
    var usage_id = usage_ids[i];
    print("Fixing discussion_ids " + usage_id.usage_id + " => " + usage_id.discussion_id);
    db.contents.update(
        {'commentable_id': usage_id.usage_id},
        {$set: {'commentable_id': usage_id.discussion_id}},
        {multi: true}
    )
}