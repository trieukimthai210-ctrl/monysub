
const $ = id => document.getElementById(id);

async function api(url, method = "GET", body) {
  const response = await fetch("/api" + url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Có lỗi xảy ra");
  }

  return data;
}

function showMessage(message) {
  $("message").textContent = message;
}

async function register() {
  try {
    await api("/register", "POST", {
      username: $("username").value.trim(),
      password: $("password").value
    });

    showMessage("Đăng ký thành công! Hãy đăng nhập.");
  } catch (error) {
    showMessage(error.message);
  }
}

async function login() {
  try {
    await api("/login", "POST", {
      username: $("username").value.trim(),
      password: $("password").value
    });

    await load();
  } catch (error) {
    showMessage(error.message);
  }
}

async function logout() {
  try {
    await api("/logout", "POST");
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

async function submitTask(id) {
  try {
    await api(`/tasks/${id}/submit`, "POST");
    alert("Đã gửi nhiệm vụ. Hãy chờ admin kiểm tra.");
  } catch (error) {
    alert(error.message);
  }
}

async function withdraw() {
  try {
    const amount = Number($("amount").value);

    const result = await api("/withdraw", "POST", {
      amount
    });

    alert(result.message);
    $("amount").value = "";
    await load();
  } catch (error) {
    alert(error.message);
  }
}

function createTask(task) {
  const div = document.createElement("div");
  div.className = "task";

  const title = document.createElement("h3");
  title.textContent = task.title;

  const description = document.createElement("p");
  description.textContent = task.description || "";

  const reward = document.createElement("p");
  reward.textContent = "Thưởng: " + task.reward + " điểm";

  const button = document.createElement("button");
  button.textContent = "Gửi nhiệm vụ";
  button.onclick = () => submitTask(task.id);

  div.append(title, description, reward, button);
  return div;
}

async function loadAdmin() {
  const submissions = await api("/admin/submissions");
  $("submissions").replaceChildren();

  submissions.forEach(item => {
    const div = document.createElement("div");
    div.className = "task";

    const info = document.createElement("p");
    info.textContent =
      `${item.username} – ${item.title} – ${item.reward} điểm – ${item.status}`;

    div.appendChild(info);

    if (item.status === "pending") {
      const button = document.createElement("button");
      button.textContent = "Duyệt nhiệm vụ";

      button.onclick = async () => {
        try {
          await api(`/admin/submissions/${item.id}/approve`, "POST");
          await load();
        } catch (error) {
          alert(error.message);
        }
      };

      div.appendChild(button);
    }

    $("submissions").appendChild(div);
  });

  const withdrawals = await api("/admin/withdrawals");
  $("withdrawals").replaceChildren();

  withdrawals.forEach(item => {
    const div = document.createElement("div");
    div.className = "task";

    const info = document.createElement("p");
    info.textContent =
      `${item.username} – ${item.amount} điểm – ${item.status}`;

    div.appendChild(info);

    if (item.status === "pending") {
      const button = document.createElement("button");
      button.textContent = "Xác nhận đã xử lý";

      button.onclick = async () => {
        try {
          await api(`/admin/withdrawals/${item.id}/paid`, "POST");
          await load();
        } catch (error) {
          alert(error.message);
        }
      };

      div.appendChild(button);
    }

    $("withdrawals").appendChild(div);
  });
}

async function load() {
  try {
    const user = await api("/me");

    $("login").hidden = true;
    $("dashboard").hidden = false;
    $("logoutBtn").hidden = false;

    $("name").textContent = user.username;
    $("balance").textContent = user.balance;

    const tasks = await api("/tasks");
    $("tasks").replaceChildren();

    tasks.forEach(task => {
      $("tasks").appendChild(createTask(task));
    });

    if (user.role === "admin") {
      $("admin").hidden = false;
      await loadAdmin();
    } else {
      $("admin").hidden = true;
    }

  } catch {
    $("login").hidden = false;
    $("dashboard").hidden = true;
    $("logoutBtn").hidden = true;
  }
}

load();
