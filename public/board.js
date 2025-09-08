document.addEventListener("DOMContentLoaded", async () => {
    const boardContainer = document.getElementById("board-container");

    try {
        const response = await fetch("/api/get-posts");
        if (!response.ok) {
            throw new Error("게시판 데이터를 불러오는 데 실패했습니다.");
        }

        const posts = await response.json();
        if (posts.length === 0) {
            boardContainer.innerHTML = "<p>게시물이 없습니다.</p>";
            return;
        }

        boardContainer.innerHTML = "";
        posts.forEach((post, index) => {
            const postRow = document.createElement("div");
            postRow.classList.add("post-row");

            const postNumber = document.createElement("span");
            postNumber.innerText = `${index + 1}.`;

            const postTitle = document.createElement("span");
            postTitle.innerText = post.title;
            postTitle.classList.add("clickable-title");
            postTitle.dataset.id = post.id;

            const postAuthor = document.createElement("span");
            postAuthor.innerText = `작성자: ${post.author}`;

            const postTime = document.createElement("span");
            postTime.innerText = `작성 시간: ${new Date(post.timestamp).toLocaleString()}`;

            postTitle.addEventListener("click", () => showFullStory(post.id));

            postRow.appendChild(postNumber);
            postRow.appendChild(postTitle);
            postRow.appendChild(postAuthor);
            postRow.appendChild(postTime);
            boardContainer.appendChild(postRow);
        });
    } catch (error) {
        console.error(error);
        boardContainer.innerHTML = "<p>게시판 데이터를 불러오는 중 오류가 발생했습니다.</p>";
    }
});

async function showFullStory(postId) {
    try {
        const response = await fetch(`/api/get-post/${postId}`);
        if (!response.ok) {
            throw new Error("스토리를 불러오는 데 실패했습니다.");
        }

        const post = await response.json();

        const modal = document.createElement("div");
        modal.classList.add("modal");

        const modalContent = document.createElement("div");
        modalContent.classList.add("modal-content");

        const storyTitle = document.createElement("h2");
        storyTitle.innerText = post.title;

        const storyContent = document.createElement("p");
        storyContent.innerText = post.content;

        const closeButton = document.createElement("button");
        closeButton.innerText = "닫기";
        closeButton.classList.add("close-button");
        closeButton.addEventListener("click", () => modal.remove());

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "삭제";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => confirmDelete(post.id));

        modalContent.appendChild(storyTitle);
        modalContent.appendChild(storyContent);
        modalContent.appendChild(closeButton);
        modalContent.appendChild(deleteButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    } catch (error) {
        console.error("전체 스토리를 표시하는 중 오류 발생:", error);
    }
}

function confirmDelete(postId) {
    const passwordModal = document.createElement("div");
    passwordModal.classList.add("modal");

    const passwordContent = document.createElement("div");
    passwordContent.classList.add("modal-content");

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "비밀번호 입력";
    passwordInput.classList.add("password-input");

    const submitButton = document.createElement("button");
    submitButton.innerText = "확인";
    submitButton.classList.add("submit-button");

    const cancelButton = document.createElement("button");
    cancelButton.innerText = "취소";
    cancelButton.classList.add("cancel-button");
    cancelButton.addEventListener("click", () => passwordModal.remove());

    submitButton.addEventListener("click", async () => {
        const password = passwordInput.value.trim();
        if (!password) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch(`/api/delete-post/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert("게시물이 삭제되었습니다.");
                location.reload();
            } else {
                alert(result.message || "삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error("게시물 삭제 중 오류 발생:", error);
            alert("서버 오류로 인해 삭제에 실패했습니다.");
        }

        passwordModal.remove();
    });

    passwordContent.appendChild(passwordInput);
    passwordContent.appendChild(submitButton);
    passwordContent.appendChild(cancelButton);
    passwordModal.appendChild(passwordContent);
    document.body.appendChild(passwordModal);
}
