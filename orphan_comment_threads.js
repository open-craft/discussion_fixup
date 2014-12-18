var discussion_ids = db.getSiblingDB('edxapp').modulestore
.find({'_id.category':'discussion-forum', 'metadata.discussion_id': {$exists: true}})
.map(function(doc) { 
    return doc.metadata.discussion_id; 
});

db.contents.find({'_type':'CommentThread', 'commentable_id': {$nin: discussion_ids}})