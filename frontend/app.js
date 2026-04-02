// Backend'imizin adresi
const API = "http://localhost:8000";

// Supabase bağlantısı (Auth için)
const SUPABASE_URL = "https://nrtrbqillxjnsosrugqh.supabase.co";
const SUPABASE_KEY = "sb_publishable_0Qd7FAGw9N2_ckAcOx1W-g_TGBVXIjG";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Giriş yapan kullanıcıyı burada tutuyoruz
let currentUser = null;

// Sayfa açılınca oturum var mı kontrol et
window.onload = async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
        currentUser = data.session.user;
        showMainScreen();
    }
};

// Kayıt ol
async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return alert("Hata: " + error.message);
    alert("Kayıt başarılı! E-postanı doğrula.");
}

// Giriş yap
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert("Hata: " + error.message);
    currentUser = data.user;
    showMainScreen();
}

// Çıkış yap
async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    document.getElementById("auth-screen").style.display = "block";
    document.getElementById("main-screen").style.display = "none";
}

// Ana ekranı göster
function showMainScreen() {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("main-screen").style.display = "block";
    loadHabits();
}

// Alışkanlıkları yükle
async function loadHabits() {
    const res = await fetch(`${API}/habits/${currentUser.id}`);
    const habits = await res.json();
    const list = document.getElementById("habits-list");
    list.innerHTML = "";

    for (const habit of habits) {
        // Her alışkanlığın streak'ini al
        const streakRes = await fetch(`${API}/habits/${habit.id}/streak`);
        const streakData = await streakRes.json();

        list.innerHTML += `
            <div class="habit-card">
                <span class="habit-name">${habit.name}</span>
                <div class="habit-actions">
                    <span class="streak">🔥 ${streakData.streak} gün</span>
                    <button class="done" onclick="logHabit('${habit.id}')">✓ Yaptım</button>
                    <button class="delete" onclick="deleteHabit('${habit.id}')">Sil</button>
                </div>
            </div>
        `;
    }
}

// Alışkanlık ekle
async function addHabit() {
    const name = document.getElementById("habit-name").value;
    if (!name) return alert("Alışkanlık adı gir!");
    await fetch(`${API}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, user_id: currentUser.id })
    });
    document.getElementById("habit-name").value = "";
    loadHabits();
}

// Alışkanlık sil
async function deleteHabit(id) {
    await fetch(`${API}/habits/${id}`, { method: "DELETE" });
    loadHabits();
}

// "Yaptım" olarak işaretle
async function logHabit(id) {
    const today = new Date().toISOString().split("T")[0];
    await fetch(`${API}/habits/${id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id, date: today })
    });
    loadHabits();
}