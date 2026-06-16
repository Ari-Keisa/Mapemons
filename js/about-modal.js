document.addEventListener('DOMContentLoaded', () => {
    // Dialog data using ORIGINAL text exactly as requested
    // Ari is the main speaker. We use focusCharacter to show the secondary character on the right.
    const dialogues = [
        { name: "Ари", color: "#6b11ff", text: "Приветик юный покетренер! Рада тебя видеть тут o(〃＾▽＾〃)o" },
        { name: "Ари", color: "#6b11ff", text: "Эта страничка была создана, чтобы помочь ориентироваться в игре Monsters - MMORPG. Очень надеюсь, что этот проект поможет тебе найти тут то, что тебе нужно. ✦" },
        { name: "Ари", color: "#6b11ff", text: "✨ О создании ✨ Не так давно в нашем мире появилась замечательная игра по миру покемонов. Уверена, каждый попал сюда не случайно. И действительно в игру вложена душа. ✧" },
        { name: "Ари", color: "#6b11ff", text: "Зайдя в игру и немного ознакомившись, мне пришла идея сделать что-то, что поможет всем и каждому добраться куда угодно без проблем и найти что-то, что ему очень надо. Идея заключалась в том, чтобы сделать удобный маршрутизатор, который укажет путь к любой точке мира данной игры. ✦" },
        { name: "Ари", color: "#6b11ff", text: "Уверена, многим из вас часто приходится искать конкретных покемонов, какие-то предметы или даже нпс. Да и в целом любую нужную информацию. И эта страничка нацелена на то, чтобы помочь в поиске объекта. ✧" },
        { name: "Ари", color: "#6b11ff", text: "Нашёл и сразу узнал где можно взять то, что тебе нужно, и сразу посмотрел как дойти туда с любой точки мира. ✨🌸✨" },
        { name: "Ари", color: "#6b11ff", text: "Если кому интересно - я Ари. Не сказала бы что я прям сильный программист и разработчик, но всей душей я хотела помочь всем и каждому. Старалась всё сделать удобно, красиво, понятно и достоверно. ✦" },
        { name: "Ари", color: "#6b11ff", text: "Но если вдруг вы найдёте что-то странное или не совсем корректное - не бейте тапочками позязя (｡•́︿•̀｡). Я старалась для вас. Если что - можете сообщить мне - @ari_keisa. Я с удовольствием вам отвечу и постараюсь исправить аномалию. ◍˃ᵕ˂◍" },
        { name: "Ари", color: "#6b11ff", text: "Я старалась никого не кошмарить лишними глупыми вопросами, но всё же умудрилась таки втянуть несколько человек ( ◡‿◡ ♡). Эти солнышки немного упростили процесс сбора нужной мне информации для этого чуда-творения. ✧" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Хас", text: "Итак, первый, о ком скажу, будет конечно же Хас. Это тот самый человечек, который создал для вас эту чудесную игру. Главный мастер, без которого бы у нас не было такой крутой игры. ✦" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Хас", text: "Он любезно позволил мне себя немножечко ограбить (*/ω＼). Конечно я получила далеко не всё, так как много где есть секретные буковки. Однако основную информацию об покемошках и локациях игры я получила от него. Тем самым обеспечив соответствия с реальным игровым миром.\nБез него бы вы ждали Mapemons в разы дольше. ⭐✨" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Ланс", text: "Следующий человечек, которого я бы хотела отметить, это Ланс. Для проэкта назову его путеводителем. А так в целом в игре он является наставником для многих, уверена его многие знают. ✦" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Ланс", text: "Для меня же он милый братишка. Чудо, которое часто ворчит, но всё же поддержит. Думаю вы заметили, что в Mapemons в регионах присутствует более детальное разделение локаций. Не просто город и маршут, а более конкретно что это. ✧" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Ланс", text: "Сбором и уточнением описаний локаций занимался именно братишка. А так в целом он был просто рядом. Когда мне было грустно, когда что-то не получалось, когда просто казалось что я не справлюсь - он просто слушал и поддерживал. Этот человечек верил в меня до конца и за это ему огромнейшое спасибо. ✦" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Лина", text: "Также хочу отметить ещё одно прекрасное солнышко. Возможно многие её тоже знают - это Лина. Для меня - милая сестрёнка, для проекта - хранитель артефактов, ну а для вас наверное один из сильных игроков. ✧" },
        { name: "Ари", color: "#6b11ff", focusCharacter: "Лина", text: "Почему хранитель артефактов? Да потому что именно она уточняла информацию о том какой покемон что с собой носит. Этим самым тоже очень помогла собрать помощник для вас в разы быстрее, чем всю информацию я собирала сама. Тоже ей благодарна. ✦" },
        { name: "Ари", color: "#6b11ff", text: "По большому счёту я могла никого не мучить и собирать всю информацию сама, но мне очень хотелось побыстрее всё собрать и оформить для вас. (♡°▽°♡)" },
        { name: "Ари", color: "#6b11ff", text: "Надеюсь вам это поможет в развитии.\nВсего хорошего и приятной игры 💖" },
        { name: "FINAL", text: "" }
    ];

    const overlay = document.getElementById('vnOverlay');
    const dialogBox = document.getElementById('vnDialogBox');
    const namePlate = document.getElementById('vnNamePlate');
    const namePlateRight = document.getElementById('vnNamePlateRight');
    const textContainer = document.getElementById('vnText');
    const indicator = document.getElementById('vnIndicator');
    const portrait = document.getElementById('vnPortrait');
    const portraitRight = document.getElementById('vnPortraitRight');
    const finalScreen = document.getElementById('vnFinalScreen');
    const closeBtns = document.querySelectorAll('.vn-close-btn, .vn-close-btn-clean');

    let currentDialogIndex = 0;
    let isTyping = false;
    let typeInterval = null;

    const secretAngelBtn = document.getElementById('secretAngelBtn');
    if (secretAngelBtn) {
        secretAngelBtn.addEventListener('click', startVisualNovel);
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeVisualNovel();
        });
    });

    if (dialogBox) {
        dialogBox.addEventListener('click', handleNextDialog);
    }

    function startVisualNovel() {
        if (!overlay) return;
        currentDialogIndex = 0;
        overlay.classList.remove('hidden-temp');
        setTimeout(() => overlay.classList.add('active'), 10);
        
        finalScreen.classList.remove('active');
        dialogBox.style.display = 'block';
        portrait.style.display = 'block';
        portraitRight.style.display = 'block';
        
        showDialog(currentDialogIndex);
    }

    function closeVisualNovel() {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden-temp'), 500);
        if (typeInterval) clearInterval(typeInterval);
        
        const finalVideo = document.getElementById('vnFinalVideo');
        if (finalVideo) {
            finalVideo.pause();
            finalVideo.currentTime = 0;
        }
    }

    function showDialog(index) {
        const dialog = dialogues[index];
        
        if (dialog.name === "FINAL") {
            dialogBox.style.display = 'none';
            portrait.style.display = 'none';
            portraitRight.style.display = 'none';
            const finalVideo = document.getElementById('vnFinalVideo');
            if (finalVideo) {
                let currentVideo = localStorage.getItem('mapemons_vn_video');
                if (!currentVideo) currentVideo = '1';
                
                finalVideo.src = `images/video_${currentVideo}.mp4`;
                finalVideo.currentTime = 0;
                finalVideo.load();
                finalVideo.play().catch(e => console.error(e));
                
                let nextVideo = currentVideo === '1' ? '2' : '1';
                localStorage.setItem('mapemons_vn_video', nextVideo);
            }
            
            finalScreen.classList.add('active');
            return;
        }

        namePlate.textContent = dialog.name;
        namePlate.style.backgroundColor = dialog.color;
        namePlate.style.color = "#fff"; // Ensure white text for darker backgrounds
        
        // Setup main portrait (Ari)
        portrait.style.backgroundImage = `url('${encodeURI('images/Ари.png')}'), linear-gradient(-45deg, #09091a, #1a0b2e, #4a00e0, #2d0080)`;
        portrait.style.backgroundSize = "contain, 200% 200%";
        portrait.style.backgroundPosition = "center bottom, 0% 50%";
        
        // Remove and re-add class to trigger animation
        portrait.classList.remove('active');
        void portrait.offsetWidth; // trigger reflow
        portrait.classList.add('active');

        // Setup right portrait if someone is mentioned
        portraitRight.classList.remove('active');
        namePlateRight.style.display = 'none';

        if (dialog.focusCharacter) {
            setTimeout(() => {
                namePlateRight.style.display = 'block';
                namePlateRight.textContent = dialog.focusCharacter;
                
                if (dialog.focusCharacter === "Хас") {
                    portraitRight.style.backgroundImage = `url('${encodeURI('images/Хас.png')}'), linear-gradient(-45deg, #000000, #595959, #1a1a1a, #666666)`;
                    namePlateRight.style.backgroundColor = "#434343";
                    namePlateRight.style.color = "#fff";
                } else if (dialog.focusCharacter === "Ланс") {
                    portraitRight.style.backgroundImage = `url('${encodeURI('images/Ланс.png')}'), linear-gradient(-45deg, #004d26, #00ff00, #0ba360, #00cc66)`;
                    namePlateRight.style.backgroundColor = "#0ba360";
                    namePlateRight.style.color = "#fff";
                } else if (dialog.focusCharacter === "Лина") {
                    portraitRight.style.backgroundImage = `url('${encodeURI('images/Лина.png')}'), linear-gradient(-45deg, #f6d365, #ff8a00, #fda085, #ff4e50)`;
                    namePlateRight.style.backgroundColor = "#f6d365";
                    namePlateRight.style.color = "#111";
                }
                portraitRight.style.backgroundSize = "contain, 200% 200%";
                portraitRight.style.backgroundPosition = "center bottom, 0% 50%";
                portraitRight.classList.add('active');
            }, 100);
        }

        indicator.classList.remove('show');
        textContainer.innerHTML = '';
        
        isTyping = true;
        let charIndex = 0;
        if (typeInterval) clearInterval(typeInterval);
        
        typeInterval = setInterval(() => {
            if (charIndex < dialog.text.length) {
                let char = dialog.text.charAt(charIndex);
                if (char === '\n') char = '<br>';
                textContainer.innerHTML += char;
                charIndex++;
            } else {
                clearInterval(typeInterval);
                isTyping = false;
                indicator.classList.add('show');
            }
        }, 30);
    }

    function handleNextDialog() {
        if (isTyping) {
            clearInterval(typeInterval);
            let fullText = dialogues[currentDialogIndex].text.replace(/\n/g, '<br>');
            textContainer.innerHTML = fullText;
            isTyping = false;
            indicator.classList.add('show');
        } else {
            currentDialogIndex++;
            if (currentDialogIndex < dialogues.length) {
                showDialog(currentDialogIndex);
            }
        }
    }
});
