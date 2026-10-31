-- Export the Goodreads library from the logged-in Safari on yeats and print the
-- CSV to stdout. Needs Safari > Develop > Allow JavaScript from Apple Events.
-- Clicks "Export Library", waits for a fresh export link, then fetches it with
-- the page's own session cookies.
on js(d, code)
	tell application "Safari" to return do JavaScript code in d
end js

on run
	tell application "Safari"
		set d to make new document with properties {URL:"https://www.goodreads.com/review/import"}
	end tell
	try
		-- wait for the page to load
		repeat 30 times
			delay 1
			if my js(d, "document.readyState") is "complete" then exit repeat
		end repeat
		if my js(d, "location.pathname") is not "/review/import" then error "not logged in to Goodreads (landed on " & my js(d, "location.href") & ")"
		set linkJS to "(document.querySelector('a[href*=\"goodreads_library_export.csv\"]')||{}).parentElement?.innerText||''"
		set prevLink to my js(d, linkJS)
		set clicked to my js(d, "var b=Array.from(document.querySelectorAll('button,input[type=submit],a')).find(e=>/export library/i.test(e.innerText||e.value||'')); b?(b.click(),'ok'):'missing'")
		if clicked is not "ok" then error "Export Library button not found"
		-- the export is generated server-side; the page swaps in a new link when done
		set ready to false
		repeat 60 times
			delay 5
			set curLink to my js(d, linkJS)
			if curLink is not "" and curLink is not prevLink then
				set ready to true
				exit repeat
			end if
		end repeat
		if not ready then error "export link did not refresh within 5 minutes"
		my js(d, "window.__csv=null;fetch(document.querySelector('a[href*=\"goodreads_library_export.csv\"]').href,{credentials:'include'}).then(r=>r.ok?r.text():Promise.reject(r.status)).then(t=>window.__csv=t,e=>window.__csv='ERROR '+e);'started'")
		repeat 60 times
			delay 1
			set csv to my js(d, "window.__csv||''")
			if csv is not "" then exit repeat
		end repeat
		if csv is "" or csv starts with "ERROR" then error "CSV download failed: " & csv
		tell application "Safari" to close d
		return csv
	on error msg
		tell application "Safari" to close d
		error msg
	end try
end run
