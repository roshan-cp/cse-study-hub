const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL@gmail.com";

async function loadNavbar() {
    const { data } = await supabaseClient.auth.getSession();
    const user = data.session?.user;

    const navbar = document.getElementById("navbar");

    if (user) {
        navbar.innerHTML = `
            <a href="../index.html" class="nav-brand">CSE Study Hub</a>
            <div class="nav-right">
                <span>Hi, ${user.email.split("@")[0]}</span>
                <button onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        navbar.innerHTML = `
            <a href="../index.html" class="nav-brand">CSE Study Hub</a>
            <div class="nav-right">
                <a href="login.html" class="nav-login">Login</a>
            </div>
        `;
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "../index.html";
}

loadNavbar();