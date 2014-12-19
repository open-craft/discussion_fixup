edxapp_db = 'prod';
 
var usage_ids = db.getSiblingDB(edxapp_db).modulestore
.find({'_id.category':'discussion-forum', 'metadata.discussion_id': {$exists: true}})
.map(function(doc) {
    return {usage_id: doc._id.name, discussion_id: doc.metadata.discussion_id};
});
 
for (var i = 0; i < usage_ids.length; i++) {
    var usage_id = usage_ids[i];
    count = db.contents.find({"commentable_id": usage_id.usage_id}).count();
    if (count > 0) {
    print("\n\n******* Fixing documents where xBlock usage_id has been used. " + usage_id.usage_id + " => " + usage_id.discussion_id + "     FOUND: " + count);
 
    // use a forEach so we can limit (as well as print out an audit trail on the changes, rather than using a multi-document update
    db.contents.find({"commentable_id": usage_id.usage_id}).limit(count).forEach(
        function(e) {
                print("\tUpdating Id " + e._id + "  commentable_id from " + e.commentable_id + " to " + usage_id.discussion_id);
                //
                // Uncomment these two lines to update the document
                //
                // e.commentable_id = usage_id.discussion_id;
                // db.contents.save(e)
        }
    );
 
   /*
    db.contents.update(
        {'commentable_id': usage_id.usage_id},
        {$set: {'commentable_id': usage_id.discussion_id}},
        {multi: true}
    )
    */
    }
}
