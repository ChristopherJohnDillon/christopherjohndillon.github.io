-- Sign Safari on yeats back in to Goodreads with email + password, read from
-- the GR_EMAIL / GR_PASS environment (goodreads_sync.sh pulls them from the
-- Keychain). Amazon may answer with a captcha or OTP; that fails loudly and
-- needs a manual sign-in.
on js(w, code)
	tell application "Safari" to return do JavaScript code in current tab of window id w
end js

-- quote a string as a JS literal
on jsStr(t)
	set out to ""
	repeat with c in characters of t
		set c to c as text
		if c is "\\" or c is "'" then set c to "\\" & c
		set out to out & c
	end repeat
	return "'" & out & "'"
end jsStr

on waitFor(w, cond, secs)
	repeat secs times
		delay 1
		try
			if my js(w, "document.readyState==='complete'&&!!(" & cond & ")") is true then return true
		end try
	end repeat
	return false
end waitFor

on run
	set email to system attribute "GR_EMAIL"
	set pass to system attribute "GR_PASS"
	if email is "" or pass is "" then error "GR_EMAIL / GR_PASS not set"
	tell application "Safari"
		make new document with properties {URL:"https://www.goodreads.com/user/sign_in"}
		delay 1
		set w to id of front window
	end tell
	try
		my waitFor(w, "true", 30)
		if my js(w, "location.pathname") does not contain "sign_in" then
			tell application "Safari" to close window id w
			return "already signed in"
		end if
		my js(w, "var b=Array.from(document.querySelectorAll('a,button')).find(e=>/sign in with email/i.test(e.textContent));b&&b.click();!!b")
		if not my waitFor(w, "document.querySelector('#ap_email')", 30) then error "Amazon sign-in form did not appear"
		my js(w, "document.querySelector('#ap_email').value=" & my jsStr(email) & ";var p=document.querySelector('#ap_password');p?'one-step':(document.querySelector('#continue')?.click(),'two-step')")
		if not my waitFor(w, "document.querySelector('#ap_password')", 30) then error "password field did not appear"
		my js(w, "document.querySelector('#ap_password').value=" & my jsStr(pass) & ";var r=document.querySelector('input[name=rememberMe]');if(r)r.checked=true;document.querySelector('#signInSubmit').click();'ok'")
		if not my waitFor(w, "location.host==='www.goodreads.com'&&!location.pathname.includes('sign_in')", 45) then error "sign-in did not complete (captcha or OTP?) at " & my js(w, "location.href")
		tell application "Safari" to close window id w
		return "signed in"
	on error msg
		tell application "Safari" to close window id w
		error msg
	end try
end run
