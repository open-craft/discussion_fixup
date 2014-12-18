Discussion resoration instruction:

1. Make backups of modulestore and comments service databases (likely named edxapp and cs_comments_service_production)
2. Merge https://github.com/edx-solutions/edx-platform/pull/354. Alternatively, merge https://github.com/open-craft/edx-platform/commit/7ac5920d1cbee950184d487480c4d1f83e3f0c4c into any other branch and use that branch instead of `release` in step 4
3. (Optional, but recommended) Take down target site
4. Deploy `release` branch to target site
5. Modify constants in attached `fix_discussion.py` so that they contain correct credentials, server address and database names for edxapp and comments service databases
6. Run `fix_discussions.py`. It uses pymongo to connect to DB, so make sure it's run in an environment with installed pymongo. Simpliest way would be to use edxapp virtualenv.

This restores all the discussions that can be restored automatically. However, since latest backup is slightly outdated, some discussions are likely have been added after the backup. Those will likely miss discussion_ids and won't be restored by the script. Use attached 'missing_discussion_ids.js' and `orphan_comment_threads.js` to get discussions and comment threads that are still broken, and manually match them.

The following script might be useful for manual updates:

    db.contents.update(
        {'commentable_id': <current_comment_thread_commentable_id>},
        {$set: {'commentable_id': <target_discussion_discussion_id>}},
        {multi: true}
    )
    
