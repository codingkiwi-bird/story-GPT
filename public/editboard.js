function createPostModal(title, content) {
    const existingModal = document.querySelector(".modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.classList.add("modal");

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = title;
    titleInput.placeholder = "게시물 제목";
    titleInput.classList.add("title-input");
//    titleInput.disabled = true;

    const userPassContainer = document.createElement("div");
    userPassContainer.classList.add("user-pass-container");

    const authorInput = document.createElement("input");
    authorInput.type = "text";
    authorInput.placeholder = "작성자 이름";
    authorInput.classList.add("author-input");

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "비밀번호";
    passwordInput.classList.add("password-input");

    const passwordConfirmInput = document.createElement("input");
    passwordConfirmInput.type = "password";
    passwordConfirmInput.placeholder = "비밀번호 확인";
    passwordConfirmInput.classList.add("password-confirm-input");

    userPassContainer.appendChild(authorInput);
    userPassContainer.appendChild(passwordInput);
    userPassContainer.appendChild(passwordConfirmInput);

    const contentInput = document.createElement("textarea");
    contentInput.value = content;
    contentInput.placeholder = "게시물 내용";
    contentInput.classList.add("content-input");

    const submitButton = document.createElement("button");
    submitButton.innerText = "확인";
    submitButton.classList.add("submit-button");

    const closeButton = document.createElement("button");
    closeButton.innerText = "닫기";
    closeButton.classList.add("close-button");

    submitButton.addEventListener("click", async () => {
        const author = authorInput.value.trim();
        const password = passwordInput.value.trim();
        const passwordConfirm = passwordConfirmInput.value.trim();

        if (!author || !password) {
            alert("작성자 이름과 비밀번호를 입력해 주세요.");
            return;
        }
        if (password !== passwordConfirm) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const postData = {
            title: titleInput.value,
            content: contentInput.value,
            author,
            password,
            timestamp: new Date().toISOString(),
        };

        try {
            const response = await fetch("/api/submit-post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                alert("게시물이 성공적으로 등록되었습니다.");
                modal.remove();
                location.reload();
            } else {
                alert("게시물 등록 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("게시물 등록 실패:", error);
            alert("서버 오류로 게시물을 등록할 수 없습니다.");
        }
    });

    closeButton.addEventListener("click", () => {
        modal.remove();
    });

    modalContent.appendChild(titleInput);
    modalContent.appendChild(userPassContainer);
    modalContent.appendChild(contentInput);
    modalContent.appendChild(submitButton);
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}
