const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const closeButton = document.getElementById('button');
// functions to toggle sidebar on clicking close-button

function openSidebar() {
    sidebar.style.display = "block";
    // hamburger.style.display = "none";
}
function closeSidebar() {
    sidebar.style.display = "none";
    // hamburger.style.display = "block";
}

hamburger.addEventListener('click', openSidebar);
closeButton.addEventListener('click', closeSidebar);
