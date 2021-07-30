
const copyText = document.getElementById("inputLinkTable");

function copyLink() {
  copyText.select();
  document.execCommand("copy");
  document.getElementById("tooltiptext").style.visibility="visible";
}

let params = new URLSearchParams(document.location.search.substring(1));
let nameGame = params.get("game");
let nameTable = params.get("table");

copyText.value = window.location.protocol + "//" + window.location.host + "/boardgame/games/" + nameGame + "/" + nameTable + "/";
copyText.style.width = ((copyText.value.length + 1) * 8) + 'px';
document.getElementById("copyButton").addEventListener("click", copyLink);


