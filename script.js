// REPLACE BELOW WITH YOUR INFO
const GITHUB_TOKEN = "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";
const GITHUB_USERNAME = "abdullahmitha";
const REPO_NAME = "e-scooter-permit-data";

const FILE_PATH = "permits.json";
const BRANCH = "main";

async function fetchData() {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  });
  const data = await res.json();
  return {
    content: JSON.parse(atob(data.content)),
    sha: data.sha,
  };
}

async function uploadData(content, sha = null) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      message: "Update permit data",
      content: btoa(JSON.stringify(content, null, 2)),
      branch: BRANCH,
      sha,
    }),
  });
}

let permits = {};

function login() {
  const u = document.getElementById("adminUser").value;
  const p = document.getElementById("adminPass").value;
  if (u === "admin" && p === "admin123") {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    const today = new Date();
    document.getElementById("startDate").valueAsDate = today;
    const expiryDate = new Date();
    expiryDate.setFullYear(today.getFullYear() + 1);
    document.getElementById("expiryDate").valueAsDate = expiryDate;

    fetchData().then(data => {
      permits = data.content;
      window._sha = data.sha;
    });
  } else {
    alert("Incorrect credentials");
  }
}

function savePermit() {
  const m = document.getElementById("mobile").value;
  if (permits[m]) {
    alert("Permit already exists!");
    return;
  }
  const record = {
    name: document.getElementById("name").value,
    company: document.getElementById("company").value,
    eid: document.getElementById("eid").value,
    mobile: m,
    nationality: document.getElementById("nationality").value,
    startDate: document.getElementById("startDate").value,
    expiryDate: document.getElementById("expiryDate").value,
    banFrom: document.getElementById("banFrom").value,
    banTo: document.getElementById("banTo").value,
    photo: null,
  };
  const file = document.getElementById("photo").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      record.photo = reader.result;
      permits[m] = record;
      uploadData(permits, window._sha).then(() => alert("Saved with photo."));
    };
    reader.readAsDataURL(file);
  } else {
    permits[m] = record;
    uploadData(permits, window._sha).then(() => alert("Saved."));
  }
}

function searchPermit() {
  const s = document.getElementById("search").value;
  const data = Object.values(permits).find(x => x.mobile === s || x.eid === s);
  const result = document.getElementById("result");
  if (!data) {
    result.innerHTML = "<p style='color:red'>No record found.</p>";
    return;
  }
  let badge = `<span class='badge'>VALID</span>`;
  const today = new Date().toISOString().split('T')[0];
  if (data.expiryDate < today) badge = `<span class='badge expired'>EXPIRED</span>`;
  if (data.banFrom && data.banTo && today >= data.banFrom && today <= data.banTo)
    badge = `<span class='badge banned'>BANNED</span>`;
  let banLeft = '';
  if (data.banFrom && data.banTo) {
    const banToDate = new Date(data.banTo);
    if (banToDate >= new Date(today)) {
      const diffTime = banToDate - new Date(today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      banLeft = `<div class='ban-left'>Ban Left: ${diffDays} days</div>`;
    } else {
      banLeft = `<div class='ban-left' style="background-color: green;">No Ban Left</div>`;
    }
  }
  result.innerHTML = `
    <p><b>Name:</b> ${data.name}</p>
    <p><b>Company:</b> ${data.company}</p>
    <p><b>Nationality:</b> ${data.nationality}</p>
    <p><b>Emirates ID:</b> ${data.eid}</p>
    <p><b>Mobile:</b> ${data.mobile}</p>
    <p><b>Start Date:</b> ${data.startDate}</p>
    <p><b>Expiry Date:</b> ${data.expiryDate}</p>
    <p><b>Status:</b> ${badge}</p>
    ${banLeft}
    ${data.photo ? `<img src="${data.photo}">` : '<p>No photo uploaded.</p>'}
    <button onclick="removeBan('${data.mobile}')">Remove Ban</button>
  `;
}

function removeBan(mobile) {
  permits[mobile].banFrom = "";
  permits[mobile].banTo = "";
  uploadData(permits, window._sha).then(() => {
    alert("Ban removed.");
    searchPermit();
  });
}
