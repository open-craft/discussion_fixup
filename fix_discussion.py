EDXAPP_USER = 'edxapp'
EDXAPP_PASSWORD = 'password'
CS_COMMENTS_SERVICE_USER = 'edxapp'
CS_COMMENTS_SERVICE_PASSWORD = 'password'
HOST = 'localhost'
PORT = '27017'
EDXAPP_DB = 'edxapp'
EDXAPP_BACKUP_DB = 'edxapp_backup'
CS_COMMENTS_SERVICE_DB = 'cs_comments_service_development'

#### No modifications should be required beyond this line ####

import pymongo

discussion_ids_fix = """
var missing_discussion_ids = db.modulestore
    .find({'_id.category':'discussion-forum', 'metadata.discussion_id': {$exists:false}})
    .map(function (doc) { return doc._id;});

var dmap = db.getSiblingDB('%s').modulestore
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
""" % EDXAPP_BACKUP_DB

commentable_ids_fix = """
var usage_ids = db.getSiblingDB('%s').modulestore
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
""" % EDXAPP_DB


def authenticate_and_run(client, db, user, password, script):
    client[db].authenticate(user, password)
    client[db].eval(script)

client = pymongo.MongoClient('mongodb://{host}:{port}/'.format(host=HOST, port=PORT))
authenticate_and_run(client, EDXAPP_DB, EDXAPP_USER, EDXAPP_PASSWORD, discussion_ids_fix)
authenticate_and_run(client, CS_COMMENTS_SERVICE_DB, CS_COMMENTS_SERVICE_USER, CS_COMMENTS_SERVICE_PASSWORD, commentable_ids_fix)