
const copyText = document.getElementById("inputLinkTable");

function copyLink() {
  copyText.select();
  document.execCommand("copy");
  document.getElementById("tooltiptext").style.visibility="visible";
}

copyText.value = sessionStorage.getItem("linkTable");
copyText.style.width = ((copyText.value.length + 1) * 8) + 'px';
document.getElementById("copyButton").addEventListener("click", copyLink);

