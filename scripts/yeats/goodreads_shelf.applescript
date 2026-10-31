-- Scrape a Goodreads "read" shelf from the logged-in Safari on yeats and print
-- the rows as JSON. Needs Safari > Develop > Allow JavaScript from Apple Events.
--   osascript goodreads_shelf.applescript <user_id> [stop_year]
-- Pages newest-first by date read, stopping once a page reaches books read
-- before stop_year (omit or 0 for the whole shelf).
-- by window id: document references are by name, which changes as pages load
on js(w, code)
	tell application "Safari" to return do JavaScript code in current tab of window id w
end js

on run argv
	set uid to item 1 of argv
	set stopYear to "0"
	if (count of argv) > 1 then set stopYear to item 2 of argv
	tell application "Safari"
		-- a static same-origin page: the homepage redirects, aborting in-flight fetches
		make new document with properties {URL:"https://www.goodreads.com/robots.txt"}
		delay 1
		set w to id of front window
	end tell
	try
		repeat 30 times
			delay 1
			if my js(w, "location.host+document.readyState") is "www.goodreads.comcomplete" then exit repeat
		end repeat
		-- fetch + parse in the page so requests carry the Goodreads session
		my js(w, "window.__r=null;(async()=>{const UID='" & uid & "',STOP=" & stopYear & ",out=[];
for(let p=1;p<=40;p++){
const r=await fetch(`https://www.goodreads.com/review/list/${UID}?shelf=read&sort=date_read&order=d&per_page=100&page=${p}`,{credentials:'include'});
if(!r.ok)throw 'HTTP '+r.status;
const doc=new DOMParser().parseFromString(await r.text(),'text/html');
if(!doc.querySelector('#booksHeader'))throw 'no shelf table (logged out, or shelf private?)';
const rows=[...doc.querySelectorAll('tr.bookalike')];
const txt=(row,sel)=>(row.querySelector(sel)?.textContent||'').replace(/\\s+/g,' ').trim();
for(const row of rows)out.push({
book_id:row.querySelector('td.field.cover [data-resource-id]')?.dataset.resourceId||'',
title:row.querySelector('td.field.title a')?.title||'',
author:txt(row,'td.field.author a'),
pages:txt(row,'td.field.num_pages .value'),
rating:row.querySelectorAll('td.field.rating .star.on, td.field.rating .readOnlyStar.full').length,
read_at:txt(row,'td.field.date_read .date_read_value'),
cover:row.querySelector('td.field.cover img')?.src||''});
if(rows.length<100)break;
const dated=out.filter(b=>/\\d{4}/.test(b.read_at));
if(STOP&&dated.length&&+dated[dated.length-1].read_at.match(/\\d{4}/)[0]<STOP)break;}
return JSON.stringify(out)})().then(j=>window.__r=j,e=>window.__r='ERROR '+e);'started'")
		set res to ""
		repeat 120 times
			delay 1
			set res to my js(w, "window.__r||''")
			if res is not "" then exit repeat
		end repeat
		if res is "" or res starts with "ERROR" then error "shelf scrape failed: " & res
		tell application "Safari" to close window id w
		return res
	on error msg
		tell application "Safari" to close window id w
		error msg
	end try
end run
