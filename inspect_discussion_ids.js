var courses_to_update = [
    {from_ORG: 'Dev', to_ORG: 'AcademyMMP', course_num: 'MAPS'},
    {from_ORG: '???', to_ORG: 'AcademyMMP', course_num: 'STRAT'},
    {from_ORG: '???', to_ORG: 'Demo', course_num: 'DM01'},
    {from_ORG: '???', to_ORG: 'Mck', course_num: 'mck101'},
];
    
var dry_run = true;
var fail_fast = true;   
    
function course_name(course_spec) {
    return course_spec.to_ORG + "/" + course_spec.course_num;
}
    
function get_discussions_missing_discussion_id(org, course) {
    return db.modulestore
        .find({'_id.org':org, '_id.course':course, '_id.category':'discussion-forum', 'metadata.discussion_id': {$exists:false}})
        .map(function (doc) { return doc._id.name;});
}

function get_discussion_ids_map(org, course, discussion_ids) {
    return db.modulestore
        .find({'_id.org':org, '_id.course':course, '_id.name': {$in: discussion_ids}, 'metadata.discussion_id': {$exists:true}})
        .map(function(doc) { return {name: doc._id.name, discussion_id: doc.metadata.discussion_id}; });
}

function operation_with_error_check(operation_description, update_operation) {
    var operationStatus;
    var prefix = dry_run ? "Dry: " : "";
    print(prefix + operation_description);
    if (!dry_run) {
        update_operation();
        operationStatus = db.runCommand({ getLastError: 1 });
        if (operationStatus.err != null) {
            print("Update operation failed: " + operationStatus);
        }
        else {
            print("Success");
        }
    }
    else {
        print(prefix + "Success");
        operationStatus = { err: null, n: 0};
    }
    
    return operationStatus;
}

function update_discussion_id(org, course, name, discussion_id) {
    var search_parameters = {"_id.org": org, "_id.course":course, "_id.name": name, "_id.revision": null};
    var set_operation = {$set: {'metadata.discussion_id': discussion_id}};
    
    var published_update = operation_with_error_check("Updating published version ...", function() {db.modulestore.update(search_parameters, set_operation)});
    
    search_parameters["_id.revision"] = "draft";
    var draft_update = operation_with_error_check("Updating draft version ...", function() {db.modulestore.update(search_parameters, set_operation)});
    
    return {
        success: published_update.err == null && draft_update.err == null, 
        count: published_update.n + draft_update.n
    };
}

function process_course(course_spec){
    print("Updating course " + course_name(course_spec) + "; taking discussion_ids from " + course_spec.from_ORG + "/" + course_spec.course_num);
    
    var missing_discussion_ids = get_discussions_missing_discussion_id(course_spec.to_ORG, course_spec.course_num);    
    var dmap = get_discussion_ids_map(course_spec.from_ORG, course_spec.course_num, missing_discussion_ids);
    
    var success_updates = 0;

    for (var i=0; i < dmap.length; i++) {
        var discussion = dmap[i];
        print("Fixing discussion id for " + discussion.name + ": Setting discussion_id to " + discussion.discussion_id);
        var update_status = update_discussion_id(course_spec.to_ORG, course_spec.course_num, discussion.name, discussion.discussion_id);
        
        success_updates += update_status.count;
        if (fail_fast && !update_status.success) {
            print("Failure occured - stopping");
            break;
        }
    }
    print("Updated " + success_updates + " documents!");
    print(missing_discussion_ids.length + " original documents missing discussion_id");
}

for (var i=0; i < courses_to_update.length; i++) {
    var spec = courses_to_update[i];
    if (spec.from_ORG == '???') {
        print("Error: Please specify source organization for extracting discussion_ids for " + course_name(spec));
        print("Skipping " + course_name(spec));
        print("");
        continue;
    }
    process_course(spec);
    print("Course " + course_name(spec) + " completed");
    print("");
}