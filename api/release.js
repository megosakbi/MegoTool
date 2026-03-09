function sendRelease(){

const name = document.getElementById("name").value
const gameid = document.getElementById("gameid").value
const desc = document.getElementById("desc").value

fetch("/api/release",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name:name,
gameid:gameid,
desc:desc
})
})

.then(()=>alert("Release sent"))

}
