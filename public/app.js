// ==========================
// TOKEN
// ==========================
function getToken() {
    return localStorage.getItem("token");
}

// ==========================
// MODEL LIST PAGE
// ==========================
async function loadModels() {
    const res = await fetch("/api/models");
    const data = await res.json();

    const container = document.getElementById("model-list");
    if (!container) return;

    container.innerHTML = "";

    data.models.forEach(m => {
        const box = document.createElement("div");
        box.className = "model-box";
        box.innerHTML = `
            <img src="${m.img}" class="model-img">
            <p>${m.name}</p>
        `;
        box.onclick = () => {
            localStorage.setItem("selectedModel", m.id);
            localStorage.setItem("selectedModelImg", m.img);
            window.location.href = "generate.html";
        };
        container.appendChild(box);
    });
}

// ==========================
// GENERATE PAGE
// ==========================
async function prepareGeneratePage() {
    const modelId = localStorage.getItem("selectedModel");
    const modelImg = localStorage.getItem("selectedModelImg");

    if (!modelId) return;

    document.getElementById("modelPreview").src = modelImg;

    document.getElementById("generatePromptBtn").onclick = async () => {
        const shot = document.getElementById("shot").value;
        const pose = document.getElementById("pose").value;
        const emotion = document.getElementById("emotion").value;
        const desc = document.getElementById("desc").value;

        const clothInput = document.getElementById("cloth");
        let clothFileName = "";

        if (clothInput.files.length > 0) {
            const form = new FormData();
            form.append("cloth", clothInput.files[0]);

            const uploadRes = await fetch("/upload-cloth", {
                method: "POST",
                body: form
            });
            const uploadData = await uploadRes.json();
            clothFileName = uploadData.fileName;
        }

        const res = await fetch("/generate-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                modelId,
                shot,
                pose,
                emotion,
                description: desc,
                clothFileName
            })
        });

        const data = await res.json();
        document.getElementById("promptOutput").value = data.prompt;
    };

    document.getElementById("generateImageBtn").onclick = async () => {
        const finalPrompt = document.getElementById("promptOutput").value;

        const res = await fetch("/generate-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + getToken()
            },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("generatedImage", data.imageUrl);
            window.location.href = "result.html";
        } else {
            alert("이미지 생성 실패: " + data.message);
        }
    };
}

// ==========================
// RESULT PAGE
// ==========================
function loadResult() {
    const img = localStorage.getItem("generatedImage");
    if (!img) return;

    document.getElementById("resultImg").src = img;
}