var courses_to_update = [
    {org: 'AcademyMMP', course_num: 'MAPS'},
    {org: 'AcademyMMP', course_num: 'STRAT'},
    {org: 'Demo', course_num: 'DM01'},
    {org: 'Mck', course_num: 'mck101'},
];

var edxapp_db = 'prod';
var dry_run = true;
    
function course_name(spec) {
    return spec.org + "/" + spec.course_num;
}
    
function get_discussion_name_to_id_map(org, course){
    return db.getSiblingDB(edxapp_db).modulestore
        .find({'_id.org': org, '_id.course': course, '_id.category':'discussion-forum', '_id.revision': null, 'metadata.discussion_id': {$exists: true}})
        .map(function(doc) {
            return {usage_id: doc._id.name, discussion_id: doc.metadata.discussion_id};
        });
}

function update_single_thread(thread, new_commentable_id) {
    var prefix = dry_run ? "\tDry: " : "\t";
    print(prefix + "Updating Id " + thread._id + "  commentable_id from " + thread.commentable_id + " to " + new_commentable_id);
    if (!dry_run) {
        thread.commentable_id = new_commentable_id;
        db.contents.save(thread);
    }
}

function process_comments_for_course(spec){ 
    print("Updating comment threads for course " + course_name(spec));
    var usage_ids = get_discussion_name_to_id_map(spec.org, spec.course_num);
     
    for (var i = 0; i < usage_ids.length; i++) {
        var usage_id = usage_ids[i],
            search_query = {"_type": "CommentThread", "commentable_id": usage_id.usage_id};
            comment_threads = db.contents.find(search_query);
        
        var count = comment_threads.count();
        if (count > 0) {
            print("\n\n******* Fixing documents where xBlock usage_id has been used. " + usage_id.usage_id + " => " + usage_id.discussion_id + "     FOUND: " + count);
         
            // use a forEach so we can limit (as well as print out an audit trail on the changes, rather than using a multi-document update
            comment_threads.forEach(function(e) { update_single_thread(e, usage_id.discussion_id); });
        }
    }
}

for (var i=0; i < courses_to_update.length; i++) {
    var spec = courses_to_update[i];
    process_comments_for_course(spec);
    print("Course " + course_name(spec) + " updated");
    print("");
}
