// Polyfill para requestAnimationFrame (compatibilidade com Chrome antigo)
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                window.mozRequestAnimationFrame || 
                                window.oRequestAnimationFrame || 
                                window.msRequestAnimationFrame || 
                                function(callback) {
                                    return window.setTimeout(callback, 1000 / 60);
                                };
}

// Sistema de Dark Mode
class DarkModeManager {
    constructor() {
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.body = document.body;
        
        // Carregar preferência salva - dark mode como padrão
        const savedMode = localStorage.getItem('darkMode');
        this.isDarkMode = savedMode !== null ? savedMode === 'true' : true;
        
        // Aplicar tema inicial
        this.applyTheme();
        
        // Configurar event listener
        this.darkModeToggle.addEventListener('click', () => {
            this.toggleDarkMode();
        });
    }
    
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        
        // Salvar preferência
        localStorage.setItem('darkMode', this.isDarkMode.toString());
    }
    
    applyTheme() {
        if (this.isDarkMode) {
            this.body.classList.add('dark-mode');
            this.darkModeToggle.textContent = '☀️';
            this.darkModeToggle.classList.add('dark');
        } else {
            this.body.classList.remove('dark-mode');
            this.darkModeToggle.textContent = '🌙';
            this.darkModeToggle.classList.remove('dark');
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.playButton = document.getElementById('playButton');
        this.uiOverlay = document.getElementById('uiOverlay');
        this.instructions = document.getElementById('instructions');
        this.instructionsPanel = document.getElementById('instructionsPanel');
        this.instructionsContent = document.getElementById('instructionsContent');
        this.gameOverScreen = document.getElementById('gameOver');
        this.restartButton = document.getElementById('restartButton');
        this.positionElement = document.getElementById('position');
        this.statusElement = document.getElementById('status');
        this.scoreElement = document.getElementById('score');
        this.enemyCountElement = document.getElementById('enemyCount');
        this.finalScoreElement = document.getElementById('finalScore');
        this.maxEnemiesElement = document.getElementById('maxEnemies');
        this.nextUpgradeElement = document.getElementById('nextUpgrade');
        this.playerHealthElement = document.getElementById('playerHealth');
        this.playerNameElement = document.getElementById('playerName');
        this.changeNicknameBtn = document.getElementById('changeNicknameBtn');
        
        // Elementos da tela de boas-vindas
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.nicknameInput = document.getElementById('nicknameInput');
        this.startGameButton = document.getElementById('startGameButton');
        this.enemiesGuide = document.getElementById('enemiesGuide');
        
        // Elementos da tela de seleção de modo
        this.modeSelectionScreen = document.getElementById('modeSelectionScreen');
        this.selectedMode = null;
        
        // Configurações do modo Grabber
        this.grabberMode = {
            active: false,
            hookCooldown: 0,
            maxHookCooldown: 120, // 2 segundos
            hookRange: 400,
            hookSpeed: 14,
            hookActive: false,
            hookProjectile: null
        };
        
        // Elementos do modo Jungler
        this.junglerGameScreen = document.getElementById('junglerGameScreen');
        this.healthBarFill = document.getElementById('healthBarFill');
        this.healthBarText = document.getElementById('healthBarText');
        this.smiteZone = document.getElementById('smiteZone');
        this.berserkerImage = document.getElementById('berserkerImage');
        this.junglerFeedback = document.getElementById('junglerFeedback');
        this.junglerHits = document.getElementById('junglerHits');
        this.junglerMisses = document.getElementById('junglerMisses');
        this.junglerAccuracy = document.getElementById('junglerAccuracy');
        this.junglerExitBtn = document.getElementById('junglerExitBtn');
        this.lanerExitBtn = document.getElementById('lanerExitBtn');
        this.fastTargetValue = document.getElementById('fastTargetValue');
        this.lightningEffect = document.getElementById('lightning');
        this.dragonGlow = document.getElementById('dragonGlow');
        
        // Estado do mini-game Jungler
        this.junglerGame = {
            active: false,
            maxHealth: 3500,
            currentHealth: 3500,
            drainSpeed: 1,
            smiteThreshold: 0,
            targetValue: 450,
            hits: 0,
            misses: 0,
            canSmite: true,
            animationFrame: null
        };
        
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.playerNickname = '';
        
        // Configuração de tipos de inimigos habilitados
        this.enabledEnemyTypes = {
            fast: true,
            tank: true,
            sniper: true,
            berserker: true,
            mage: true
        };
        
        // Contadores para otimização
        this.frameCount = 0;
        this.lastCleanup = 0;
        
        // Verificar se existe nickname salvo
        this.checkSavedNickname();
        
        this.player = {
            x: 400,
            y: 300,
            size: 25,
            speed: 3,
            targetX: 400,
            targetY: 300,
            isMoving: false,
            isShooting: false,
            shootTarget: null,
            moveTarget: null, // Inimigo que o jogador quer atacar (para seguir)
            shootCooldown: 0,
            maxShootCooldown: 18, // 18 frames = 0.3 segundos
            shootRange: 250, // Range de tiro em pixels
            health: 3, // 3 pontos de vida
            maxHealth: 3,
            color: '#4CAF50',
            trail: [],
            angle: 0, // Ângulo de rotação do personagem
            // Sistema de stamina para tiros
            stamina: 100,
            maxStamina: 100,
            staminaRegenRate: 1.67, // 100/60 = 1.67 por frame para regenerar em 1s
            staminaCostPerShot: 100, // Custo total da stamina por tiro
            canShoot: true
        };
        
        // Habilidade especial (Q)
        this.specialAbility = {
            cooldown: 0,
            maxCooldown: 60, // 1 segundo (60fps * 1)
            projectiles: [], // Array para armazenar as esferas especiais
            damage: 50, // Dano da habilidade especial
            speed: 8, // Velocidade da esfera
            size: 12, // Tamanho da esfera
            trailLength: 15 // Comprimento do rastro
        };
        
        // Habilidade de dash/pulo (E)
        this.dashAbility = {
            cooldown: 0,
            maxCooldown: 180, // 3 segundos (60fps * 3)
            range: 150, // Distância máxima do pulo
            effects: [], // Efeitos visuais do dash
            isDashing: false,
            dashDuration: 0
        };
        
        // Carregar imagem do personagem
        this.playerImage = new Image();
        this.playerImage.src = './images/char.png';
        this.playerImageLoaded = false;
        this.playerImage.onload = () => {
            this.playerImageLoaded = true;
        };
        
        // Carregar imagem do Grabber (modo especial)
        this.grabberImage = new Image();
        this.grabberImage.src = './images/grabber.png';
        this.grabberImageLoaded = false;
        this.grabberImage.onload = () => {
            this.grabberImageLoaded = true;
        };
        
        // Carregar imagens dos inimigos
        this.enemyImages = {};
        this.enemyImagesLoaded = {};
        
        // Imagem básica (fallback para tipos não específicos)
        this.enemyImages.basic = new Image();
        this.enemyImages.basic.src = './images/fast.png';
        this.enemyImagesLoaded.basic = false;
        this.enemyImages.basic.onload = () => {
            this.enemyImagesLoaded.basic = true;
        };
        
        // Imagem do tank
        this.enemyImages.tank = new Image();
        this.enemyImages.tank.src = './images/tank.png';
        this.enemyImagesLoaded.tank = false;
        this.enemyImages.tank.onload = () => {
            this.enemyImagesLoaded.tank = true;
        };
        
        // Imagem do fast
        this.enemyImages.fast = new Image();
        this.enemyImages.fast.src = './images/fast.png';
        this.enemyImagesLoaded.fast = false;
        this.enemyImages.fast.onload = () => {
            this.enemyImagesLoaded.fast = true;
        };
        
        // Imagem do sniper
        this.enemyImages.sniper = new Image();
        this.enemyImages.sniper.src = './images/sniper.png';
        this.enemyImagesLoaded.sniper = false;
        this.enemyImages.sniper.onload = () => {
            this.enemyImagesLoaded.sniper = true;
        };
        
        // Imagem do berserker
        this.enemyImages.berserker = new Image();
        this.enemyImages.berserker.src = './images/berserker.png';
        this.enemyImagesLoaded.berserker = false;
        this.enemyImages.berserker.onload = () => {
            this.enemyImagesLoaded.berserker = true;
        };
        
        // Imagem do mage
        this.enemyImages.mage = new Image();
        this.enemyImages.mage.src = './images/mage.png';
        this.enemyImagesLoaded.mage = false;
        this.enemyImages.mage.onload = () => {
            this.enemyImagesLoaded.mage = true;
        };
        
        // Para outros tipos, usar a imagem do fast como fallback
        this.enemyImages.elite = this.enemyImages.fast;
        this.enemyImagesLoaded.elite = this.enemyImagesLoaded.fast;
        
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = []; // Balas dos inimigos
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 180; // Spawn a cada 3 segundos (180 frames em 60fps)
        this.maxEnemiesOnScreen = 3; // Máximo de inimigos na tela
        this.killsForUpgrade = 4; // Kills necessários para aumentar spawn
        this.lastTime = 0; // Para controle de deltaTime no gameLoop
        this.frameTimeAccumulator = 0; // Para sistema de FPS fixo
        
        this.clickEffect = {
            x: 0,
            y: 0,
            radius: 0,
            maxRadius: 30,
            active: false,
            alpha: 1
        };
        
        // Cursor customizado estilo LoL
        this.cursor = {
            x: 0,
            y: 0,
            visible: false,
            targetEnemy: null,
            inRange: false
        };
        
        // Obstáculos físicos baseados no mapa
        this.obstacles = [
            // Obstáculo central principal
            {
                x: 350,
                y: 250,
                width: 100,
                height: 100,
                type: 'central',
                color: 'rgba(139, 69, 19, 0.7)', // Marrom para simular estrutura
                strokeColor: '#8B4513'
            },
            // Obstáculos secundários
            {
                x: 200,
                y: 150,
                width: 60,
                height: 60,
                type: 'secondary',
                color: 'rgba(105, 105, 105, 0.6)', // Cinza para pedras
                strokeColor: '#696969'
            },
            {
                x: 550,
                y: 400,
                width: 80,
                height: 50,
                type: 'secondary',
                color: 'rgba(105, 105, 105, 0.6)',
                strokeColor: '#696969'
            }
        ];
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    checkSavedNickname() {
        const savedNickname = localStorage.getItem('kitingback_nickname');
        
        if (savedNickname && savedNickname.length >= 2) {
            // Nickname salvo encontrado, pular tela de boas-vindas
            this.playerNickname = savedNickname;
            this.hideWelcomeScreen(true); // true = skip animation
        } else {
            // Mostrar tela de boas-vindas
            this.welcomeScreen.style.display = 'flex';
        }
    }
    
    showChangeNicknameDialog() {
        const newNickname = prompt('Digite seu novo nickname:', this.playerNickname);
        
        if (newNickname && newNickname.trim().length >= 2) {
            this.playerNickname = newNickname.trim();
            localStorage.setItem('kitingback_nickname', this.playerNickname);
            this.playerNameElement.textContent = this.playerNickname;
        } else if (newNickname !== null) {
            alert('Nickname deve ter pelo menos 2 caracteres!');
        }
    }
    
    toggleEnemiesMenu() {
        const container = document.getElementById('enemiesMenuContainer');
        const isExpanded = container.classList.contains('expanded');
        
        if (isExpanded) {
            this.closeEnemiesMenu();
        } else {
            this.openEnemiesMenu();
        }
    }
    
    openEnemiesMenu() {
        const container = document.getElementById('enemiesMenuContainer');
        container.classList.add('expanded');
    }
    
    closeEnemiesMenu() {
        const container = document.getElementById('enemiesMenuContainer');
        container.classList.remove('expanded');
    }
    
    handleEnemyToggle(event) {
        const circle = event.currentTarget;
        const enemyType = circle.getAttribute('data-enemy-type');
        const isCurrentlyEnabled = this.enabledEnemyTypes[enemyType];
        
        // Alternar estado
        const newState = !isCurrentlyEnabled;
        this.enabledEnemyTypes[enemyType] = newState;
        
        // Atualizar visual do círculo e card
        const enemyCard = circle.closest('.enemy-card');
        const statusText = circle.querySelector('.toggle-status');
        
        if (newState) {
            circle.classList.remove('disabled');
            enemyCard.classList.remove('disabled');
            statusText.textContent = 'ATIVO';
        } else {
            circle.classList.add('disabled');
            enemyCard.classList.add('disabled');
            statusText.textContent = 'INATIVO';
        }
        
        // Salvar configurações
        this.saveEnemySettings();
        
        // Remover inimigos existentes que não estão mais habilitados
        this.removeDisabledEnemies();
        
        // Verificar se pelo menos um tipo está habilitado
        this.validateEnemySettings();
    }
    
    removeDisabledEnemies() {
        if (this.gameStarted && !this.gameOver) {
            // Remover inimigos que não estão mais habilitados
            this.enemies = this.enemies.filter(enemy => {
                return this.enabledEnemyTypes[enemy.type] === true;
            });
            // Atualizar contador
            this.enemyCountElement.textContent = this.enemies.length;
        }
    }
    
    validateEnemySettings() {
        const hasEnabledTypes = Object.values(this.enabledEnemyTypes).some(enabled => enabled);
        
        if (!hasEnabledTypes) {
            // Reabilitar pelo menos o tipo básico 'fast'
            this.enabledEnemyTypes.fast = true;
            const fastCircle = document.querySelector('[data-enemy-type="fast"].enemy-toggle-circle');
            const fastCard = document.querySelector('[data-enemy-type="fast"].enemy-card');
            const fastStatus = fastCircle.querySelector('.toggle-status');
            
            fastCircle.classList.remove('disabled');
            fastCard.classList.remove('disabled');
            fastStatus.textContent = 'ATIVO';
            this.saveEnemySettings();
            
            // Mostrar aviso ao usuário
            alert('Pelo menos um tipo de inimigo deve estar habilitado! Tipo "Fast" foi reativado automaticamente.');
        }
    }
    
    saveEnemySettings() {
        localStorage.setItem('kitingback_enemy_settings', JSON.stringify(this.enabledEnemyTypes));
    }
    
    loadEnemySettings() {
        const savedSettings = localStorage.getItem('kitingback_enemy_settings');
        
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                this.enabledEnemyTypes = { ...this.enabledEnemyTypes, ...parsedSettings };
            } catch (e) {
                console.error('Error loading enemy settings:', e);
                // Se houver erro, usar configurações padrão
                this.enabledEnemyTypes = {
                    fast: true,
                    tank: true,
                    sniper: true,
                    berserker: true,
                    mage: true
                };
            }
        }
        
        // Aplicar configurações aos círculos e cards
        Object.keys(this.enabledEnemyTypes).forEach(enemyType => {
            const circle = document.querySelector(`[data-enemy-type="${enemyType}"].enemy-toggle-circle`);
            const enemyCard = document.querySelector(`[data-enemy-type="${enemyType}"].enemy-card`);
            
            if (circle && enemyCard) {
                const statusText = circle.querySelector('.toggle-status');
                
                if (this.enabledEnemyTypes[enemyType]) {
                    circle.classList.remove('disabled');
                    enemyCard.classList.remove('disabled');
                    statusText.textContent = 'ATIVO';
                } else {
                    circle.classList.add('disabled');
                    enemyCard.classList.add('disabled');
                    statusText.textContent = 'INATIVO';
                }
            }
        });
        
        // Validar se pelo menos um tipo está habilitado
        this.validateEnemySettings();
    }
    
    useGrabberHook() {
        // Verificar se está em cooldown
        if (this.grabberMode.hookCooldown > 0) {
            return;
        }
        
        // Verificar se já tem um hook ativo
        if (this.grabberMode.hookActive) {
            return;
        }
        
        // Usar posição do cursor
        const mouseX = this.cursor.x;
        const mouseY = this.cursor.y;
        
        if (!mouseX || !mouseY) {
            return;
        }
        
        // Calcular direção
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) return;
        
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Criar projétil do hook
        this.grabberMode.hookProjectile = {
            x: this.player.x,
            y: this.player.y,
            startX: this.player.x,
            startY: this.player.y,
            vx: dirX * this.grabberMode.hookSpeed,
            vy: dirY * this.grabberMode.hookSpeed,
            maxDistance: this.grabberMode.hookRange,
            returning: false,
            hitEnemy: null
        };
        
        this.grabberMode.hookActive = true;
        this.grabberMode.hookCooldown = this.grabberMode.maxHookCooldown;
    }
    
    useSpecialAbility() {
        // Verificar se a habilidade está em cooldown
        if (this.specialAbility.cooldown > 0) {
            return;
        }
        
        // Limitar número máximo de projéteis especiais ativos
        if (this.specialAbility.projectiles.length >= 5) {
            // Remover o mais antigo
            this.specialAbility.projectiles.shift();
        }
        
        // Usar posição do cursor atual
        const mouseX = this.cursor.x;
        const mouseY = this.cursor.y;
        
        // Validar posições
        if (!mouseX || !mouseY || isNaN(mouseX) || isNaN(mouseY)) {
            return;
        }
        
        // Calcular direção da esfera
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Evitar divisão por zero
        if (distance > 5) { // Mínimo de distância
            // Normalizar direção
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Criar esfera especial com validação
            const specialProjectile = {
                x: this.player.x,
                y: this.player.y,
                vx: dirX * this.specialAbility.speed,
                vy: dirY * this.specialAbility.speed,
                size: this.specialAbility.size,
                damage: this.specialAbility.damage,
                trail: [],
                life: 300, // Reduzir vida para 5 segundos
                id: Date.now() + Math.random() // ID único para debug
            };
            
            // Validar se o projétil tem valores válidos
            if (!isNaN(specialProjectile.vx) && !isNaN(specialProjectile.vy)) {
                this.specialAbility.projectiles.push(specialProjectile);
                
                // Ativar cooldown
                this.specialAbility.cooldown = this.specialAbility.maxCooldown;
                
                // Efeito visual de lançamento
                this.createSpecialAbilityCastEffect();
            }
        }
    }
    
    useDashAbility() {
        // Verificar se a habilidade está em cooldown ou já está dashando
        if (this.dashAbility.cooldown > 0 || this.dashAbility.isDashing) {
            return;
        }
        
        // Usar posição do cursor atual
        const mouseX = this.cursor.x;
        const mouseY = this.cursor.y;
        
        // Validar posições
        if (!mouseX || !mouseY || isNaN(mouseX) || isNaN(mouseY)) {
            return;
        }
        
        // Calcular direção e distância
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Validar distância mínima
        if (distance < 30) {
            return; // Muito perto, não dash
        }
        
        // Limitar distância ao range máximo
        const actualDistance = Math.min(distance, this.dashAbility.range);
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Calcular posição final
        const targetX = this.player.x + dirX * actualDistance;
        const targetY = this.player.y + dirY * actualDistance;
        
        // Verificar se a posição final está dentro dos limites do canvas
        const finalX = Math.max(25, Math.min(this.canvas.width - 25, targetX));
        const finalY = Math.max(25, Math.min(this.canvas.height - 25, targetY));
        
        // Criar efeito de partida
        this.createDashStartEffect();
        
        // Teleportar instantaneamente
        this.player.x = finalX;
        this.player.y = finalY;
        
        // Criar efeito de chegada
        this.createDashArrivalEffect();
        
        // Ativar cooldown
        this.dashAbility.cooldown = this.dashAbility.maxCooldown;
        
        // Parar movimento atual
        this.player.isMoving = false;
        this.player.isShooting = false;
    }
    
    updateGrabberHook() {
        // Atualizar cooldown
        if (this.grabberMode.hookCooldown > 0) {
            this.grabberMode.hookCooldown--;
        }
        
        if (!this.grabberMode.hookActive || !this.grabberMode.hookProjectile) {
            return;
        }
        
        const hook = this.grabberMode.hookProjectile;
        
        if (!hook.returning) {
            // Hook indo
            hook.x += hook.vx;
            hook.y += hook.vy;
            
            // Verificar dist\u00e2ncia m\u00e1xima
            const distFromStart = Math.sqrt(
                (hook.x - hook.startX) ** 2 + (hook.y - hook.startY) ** 2
            );
            
            if (distFromStart >= hook.maxDistance) {
                hook.returning = true;
                return;
            }
            
            // Verificar colis\u00e3o com inimigos
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const dx = hook.x - enemy.x;
                const dy = hook.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < enemy.size + 10) {
                    // Acertou o inimigo
                    hook.hitEnemy = enemy;
                    hook.returning = true;
                    break;
                }
            }
        } else {
            // Hook voltando
            if (hook.hitEnemy) {
                // Puxar inimigo junto
                const dx = this.player.x - hook.hitEnemy.x;
                const dy = this.player.y - hook.hitEnemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 30) {
                    hook.hitEnemy.x += (dx / dist) * this.grabberMode.hookSpeed;
                    hook.hitEnemy.y += (dy / dist) * this.grabberMode.hookSpeed;
                    hook.x = hook.hitEnemy.x;
                    hook.y = hook.hitEnemy.y;
                } else {
                    // Chegou perto do jogador - matar inimigo
                    const index = this.enemies.indexOf(hook.hitEnemy);
                    if (index > -1) {
                        hook.hitEnemy.beingPulled = false; // Remover flag antes de matar
                        this.enemies.splice(index, 1);
                        this.score++;
                        this.scoreElement.textContent = this.score;
                        this.enemyCountElement.textContent = this.enemies.length;
                    }
                    this.grabberMode.hookActive = false;
                    this.grabberMode.hookProjectile = null;
                }
            } else {
                // Voltar sem inimigo
                const dx = this.player.x - hook.x;
                const dy = this.player.y - hook.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 20) {
                    hook.x += (dx / dist) * this.grabberMode.hookSpeed;
                    hook.y += (dy / dist) * this.grabberMode.hookSpeed;
                } else {
                    this.grabberMode.hookActive = false;
                    this.grabberMode.hookProjectile = null;
                }
            }
        }
    }
    
    drawGrabberHook() {
        if (!this.grabberMode.hookActive || !this.grabberMode.hookProjectile) {
            return;
        }
        
        const hook = this.grabberMode.hookProjectile;
        
        this.ctx.save();
        
        // Desenhar corrente/corda
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(hook.x, hook.y);
        this.ctx.stroke();
        
        // Desenhar gancho
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(hook.x, hook.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Anel externo
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(hook.x, hook.y, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    updateSpecialAbilities() {
        // Atualizar cooldown do Q
        if (this.specialAbility.cooldown > 0) {
            this.specialAbility.cooldown--;
        }
        
        // Atualizar cooldown do dash
        if (this.dashAbility.cooldown > 0) {
            this.dashAbility.cooldown--;
        }
        
        // Proteção contra arrays muito grandes
        if (this.specialAbility.projectiles.length > 10) {
            this.specialAbility.projectiles = this.specialAbility.projectiles.slice(0, 5);
        }
        
        // Atualizar cada projétil especial (com try-catch para segurança)
        for (let i = this.specialAbility.projectiles.length - 1; i >= 0; i--) {
            try {
                const projectile = this.specialAbility.projectiles[i];
                
                // Validar se o projétil existe e tem propriedades válidas
                if (!projectile || isNaN(projectile.x) || isNaN(projectile.y)) {
                    this.specialAbility.projectiles.splice(i, 1);
                    continue;
                }
                
                // Atualizar posição
                projectile.x += projectile.vx;
                projectile.y += projectile.vy;
                
                // Validar posições após movimento
                if (isNaN(projectile.x) || isNaN(projectile.y)) {
                    this.specialAbility.projectiles.splice(i, 1);
                    continue;
                }
                
                // Adicionar rastro (limitado e controlado)
                if (!projectile.trail) projectile.trail = [];
                projectile.trail.push({ x: projectile.x, y: projectile.y });
                
                // Limitar rastro mais agressivamente
                if (projectile.trail.length > 8) { // Reduzido de 15 para 8
                    projectile.trail = projectile.trail.slice(-8);
                }
                
                // Verificar limites da tela (com margem maior)
                if (projectile.x < -100 || projectile.x > this.canvas.width + 100 || 
                    projectile.y < -100 || projectile.y > this.canvas.height + 100) {
                    this.specialAbility.projectiles.splice(i, 1);
                    continue;
                }
                
                // Diminuir vida do projétil
                projectile.life--;
                if (projectile.life <= 0) {
                    this.specialAbility.projectiles.splice(i, 1);
                    continue;
                }
                
                // Verificar colisão apenas se há inimigos
                if (this.enemies.length === 0) continue;
                
                let projectileHit = false;
                const maxEnemiesCheck = Math.min(this.enemies.length, 15); // Reduzido ainda mais
                
                for (let j = 0; j < maxEnemiesCheck; j++) {
                    const enemy = this.enemies[j];
                    if (!enemy || isNaN(enemy.x) || isNaN(enemy.y)) continue;
                    
                    // Verificação de distância otimizada
                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    
                    // Evitar cálculos desnecessários
                    if (Math.abs(dx) > 50 || Math.abs(dy) > 50) continue;
                    
                    const distanceSquared = dx * dx + dy * dy;
                    const collisionDistanceSquared = (projectile.size + enemy.size) ** 2;
                    
                    if (distanceSquared < collisionDistanceSquared) {
                        // Dano ao inimigo
                        enemy.health--;
                        
                        // Efeito de impacto mágico especial
                        this.createMagicalImpactEffect(enemy.x, enemy.y);
                        
                        // Verificar se inimigo morreu
                        if (enemy.health <= 0) {
                            this.enemies.splice(j, 1);
                            this.score += 1; // 1 ponto por inimigo morto, independente do tipo
                            this.scoreElement.textContent = this.score;
                            this.enemyCountElement.textContent = this.enemies.length;
                            
                            // Verificar se deve aumentar a dificuldade
                            this.checkUpgrade();
                            
                            // Efeito de morte (com proteção)
                            try {
                                this.spawnClickEffect(enemy.x, enemy.y, true);
                            } catch (e) {
                                console.warn('Erro no efeito de morte:', e);
                            }
                        }
                        
                        projectileHit = true;
                        break;
                    }
                }
                
                // Remover projétil se atingiu algum inimigo
                if (projectileHit) {
                    this.specialAbility.projectiles.splice(i, 1);
                }
                
            } catch (error) {
                console.warn('Erro ao processar projétil especial:', error);
                this.specialAbility.projectiles.splice(i, 1);
            }
        }
    }
    
    drawSpecialAbilities() {
        if (!this.specialAbility.projectiles || this.specialAbility.projectiles.length === 0) {
            return;
        }
        
        this.ctx.save();
        
        try {
            // Desenhar apenas os primeiros 5 projéteis para performance
            const maxProjectiles = Math.min(this.specialAbility.projectiles.length, 5);
            
            for (let p = 0; p < maxProjectiles; p++) {
                const projectile = this.specialAbility.projectiles[p];
                
                if (!projectile || isNaN(projectile.x) || isNaN(projectile.y)) {
                    continue;
                }
                
                // Efeito de energia ao redor (aura mágica)
                const time = Date.now() * 0.01;
                const auraSize = projectile.size + Math.sin(time + p) * 3;
                
                this.ctx.globalAlpha = 0.3;
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.shadowBlur = 15;
                
                // Aura externa ciano
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, auraSize + 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Aura média azul
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, auraSize + 4, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                
                this.ctx.globalAlpha = 1;
                
                // Desenhar rastro mágico aprimorado
                if (projectile.trail && projectile.trail.length > 1) {
                    this.ctx.globalCompositeOperation = 'screen';
                    
                    const maxTrailPoints = Math.min(projectile.trail.length, 6);
                    
                    for (let i = 0; i < maxTrailPoints; i += 1) {
                        if (!projectile.trail[i]) continue;
                        
                        const progress = (i + 1) / maxTrailPoints;
                        const alpha = progress * 0.5;
                        const size = Math.max(1, progress * projectile.size * 0.4);
                        
                        // Gradiente de cores no rastro
                        const colorIntensity = Math.floor(progress * 255);
                        
                        this.ctx.globalAlpha = alpha;
                        this.ctx.shadowColor = `rgb(${255 - colorIntensity}, ${colorIntensity}, 255)`;
                        this.ctx.shadowBlur = 8;
                        
                        this.ctx.beginPath();
                        this.ctx.arc(projectile.trail[i].x, projectile.trail[i].y, size, 0, Math.PI * 2);
                        this.ctx.fillStyle = `rgba(${255 - colorIntensity}, ${colorIntensity}, 255, ${alpha})`;
                        this.ctx.fill();
                        
                        // Pequenas partículas flutuantes
                        if (i % 2 === 0) {
                            const sparkleX = projectile.trail[i].x + (Math.sin(time + i) * 3);
                            const sparkleY = projectile.trail[i].y + (Math.cos(time + i) * 3);
                            
                            this.ctx.beginPath();
                            this.ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                            this.ctx.fill();
                        }
                    }
                    
                    this.ctx.globalCompositeOperation = 'source-over';
                    this.ctx.globalAlpha = 1;
                }
                
                // Núcleo principal com gradiente
                const gradient = this.ctx.createRadialGradient(
                    projectile.x, projectile.y, 0,
                    projectile.x, projectile.y, projectile.size
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.9)');
                gradient.addColorStop(1, 'rgba(100, 150, 255, 0.3)');
                
                this.ctx.shadowColor = '#FFFFFF';
                this.ctx.shadowBlur = 12;
                
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
                
                // Estrela mágica no centro
                this.ctx.save();
                this.ctx.translate(projectile.x, projectile.y);
                this.ctx.rotate(time + p);
                
                this.ctx.shadowColor = '#FFFFFF';
                this.ctx.shadowBlur = 8;
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.lineWidth = 2;
                
                // Desenhar estrela de 4 pontas
                this.ctx.beginPath();
                this.ctx.moveTo(0, -projectile.size * 0.6);
                this.ctx.lineTo(0, projectile.size * 0.6);
                this.ctx.moveTo(-projectile.size * 0.6, 0);
                this.ctx.lineTo(projectile.size * 0.6, 0);
                this.ctx.stroke();
                
                this.ctx.restore();
                
                // Anel de energia pulsante
                const pulseSize = Math.sin(time * 2 + p) * 2;
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.size + 5 + pulseSize, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
        } catch (error) {
            console.warn('Erro ao desenhar habilidades especiais:', error);
        }
        
        this.ctx.restore();
    }
    
    createSpecialAbilityCastEffect() {
        // Criar efeito de círculo expansivo no jogador
        if (!this.specialAbilityCastEffects) {
            this.specialAbilityCastEffects = [];
        }
        
        this.specialAbilityCastEffects.push({
            x: this.player.x,
            y: this.player.y,
            radius: 5,
            maxRadius: 40,
            alpha: 1,
            life: 20 // 20 frames de duração
        });
        
        // Limitar número de efeitos
        if (this.specialAbilityCastEffects.length > 3) {
            this.specialAbilityCastEffects.shift();
        }
    }
    
    updateSpecialAbilityCastEffects() {
        if (!this.specialAbilityCastEffects) return;
        
        for (let i = this.specialAbilityCastEffects.length - 1; i >= 0; i--) {
            const effect = this.specialAbilityCastEffects[i];
            
            // Expandir círculo
            effect.radius += 2;
            effect.alpha -= 0.05;
            effect.life--;
            
            // Remover efeito quando termina
            if (effect.life <= 0 || effect.alpha <= 0) {
                this.specialAbilityCastEffects.splice(i, 1);
            }
        }
    }
    
    drawSpecialAbilityCastEffects() {
        if (!this.specialAbilityCastEffects || this.specialAbilityCastEffects.length === 0) {
            return;
        }
        
        this.ctx.save();
        
        this.specialAbilityCastEffects.forEach(effect => {
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.shadowColor = '#00FFFF';
            this.ctx.shadowBlur = 10;
            
            // Círculo externo
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${effect.alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Círculo interno
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius * 0.7, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${effect.alpha * 0.8})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Partículas mágicas
            const particleCount = 6;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const px = effect.x + Math.cos(angle) * effect.radius * 0.8;
                const py = effect.y + Math.sin(angle) * effect.radius * 0.8;
                
                this.ctx.beginPath();
                this.ctx.arc(px, py, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha})`;
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }
    
    createMagicalImpactEffect(x, y) {
        // Criar efeito de explosão mágica no ponto de impacto
        if (!this.magicalImpactEffects) {
            this.magicalImpactEffects = [];
        }
        
        // Efeito principal de explosão
        this.magicalImpactEffects.push({
            x: x,
            y: y,
            type: 'explosion',
            radius: 2,
            maxRadius: 25,
            alpha: 1,
            life: 15
        });
        
        // Partículas que voam para fora
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.magicalImpactEffects.push({
                x: x,
                y: y,
                type: 'particle',
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 3,
                alpha: 1,
                life: 12,
                color: i % 2 === 0 ? 'cyan' : 'white'
            });
        }
        
        // Limitar número de efeitos
        if (this.magicalImpactEffects.length > 30) {
            this.magicalImpactEffects = this.magicalImpactEffects.slice(0, 30);
        }
    }
    
    updateMagicalImpactEffects() {
        if (!this.magicalImpactEffects) return;
        
        for (let i = this.magicalImpactEffects.length - 1; i >= 0; i--) {
            const effect = this.magicalImpactEffects[i];
            
            if (effect.type === 'explosion') {
                effect.radius += 1.5;
                effect.alpha -= 0.07;
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.95; // Desaceleração
                effect.vy *= 0.95;
                effect.size *= 0.95;
                effect.alpha -= 0.08;
            }
            
            effect.life--;
            
            if (effect.life <= 0 || effect.alpha <= 0) {
                this.magicalImpactEffects.splice(i, 1);
            }
        }
    }
    
    drawMagicalImpactEffects() {
        if (!this.magicalImpactEffects || this.magicalImpactEffects.length === 0) {
            return;
        }
        
        this.ctx.save();
        
        this.magicalImpactEffects.forEach(effect => {
            this.ctx.globalAlpha = effect.alpha;
            
            if (effect.type === 'explosion') {
                // Explosão circular
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.shadowBlur = 15;
                
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${effect.alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                // Núcleo branco
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius * 0.5, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha * 0.8})`;
                this.ctx.fill();
                
            } else if (effect.type === 'particle') {
                // Partículas
                this.ctx.shadowColor = effect.color === 'cyan' ? '#00FFFF' : '#FFFFFF';
                this.ctx.shadowBlur = 8;
                
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                this.ctx.fillStyle = effect.color === 'cyan' ? 
                    `rgba(0, 255, 255, ${effect.alpha})` : 
                    `rgba(255, 255, 255, ${effect.alpha})`;
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }
    
    createDashStartEffect() {
        // Criar efeito na posição inicial
        if (!this.dashAbility.effects) {
            this.dashAbility.effects = [];
        }
        
        this.dashAbility.effects.push({
            x: this.player.x,
            y: this.player.y,
            type: 'start',
            radius: 5,
            maxRadius: 30,
            alpha: 1,
            life: 15
        });
    }
    
    createDashArrivalEffect() {
        // Criar efeito na posição final
        if (!this.dashAbility.effects) {
            this.dashAbility.effects = [];
        }
        
        this.dashAbility.effects.push({
            x: this.player.x,
            y: this.player.y,
            type: 'arrival',
            radius: 2,
            maxRadius: 25,
            alpha: 1,
            life: 12
        });
        
        // Partículas douradas ao redor
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            this.dashAbility.effects.push({
                x: this.player.x,
                y: this.player.y,
                type: 'particle',
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                size: 3,
                alpha: 1,
                life: 20
            });
        }
        
        // Limitar efeitos
        if (this.dashAbility.effects.length > 50) {
            this.dashAbility.effects = this.dashAbility.effects.slice(0, 50);
        }
    }
    
    updateDashEffects() {
        if (!this.dashAbility.effects) return;
        
        for (let i = this.dashAbility.effects.length - 1; i >= 0; i--) {
            const effect = this.dashAbility.effects[i];
            
            if (effect.type === 'start' || effect.type === 'arrival') {
                effect.radius += 1.8;
                effect.alpha -= 0.07;
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.92;
                effect.vy *= 0.92;
                effect.size *= 0.96;
                effect.alpha -= 0.05;
            }
            
            effect.life--;
            
            if (effect.life <= 0 || effect.alpha <= 0) {
                this.dashAbility.effects.splice(i, 1);
            }
        }
    }
    
    drawDashEffects() {
        if (!this.dashAbility.effects || this.dashAbility.effects.length === 0) {
            return;
        }
        
        this.ctx.save();
        
        this.dashAbility.effects.forEach(effect => {
            this.ctx.globalAlpha = effect.alpha;
            
            if (effect.type === 'start') {
                // Efeito de partida - círculos dourados
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 15;
                
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${effect.alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                // Núcleo amarelo
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius * 0.6, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 0, ${effect.alpha * 0.7})`;
                this.ctx.fill();
                
            } else if (effect.type === 'arrival') {
                // Efeito de chegada - explosão dourada
                this.ctx.shadowColor = '#FFA500';
                this.ctx.shadowBlur = 12;
                
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 165, 0, ${effect.alpha})`;
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
                
                // Centro brilhante
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius * 0.4, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha})`;
                this.ctx.fill();
                
            } else if (effect.type === 'particle') {
                // Partículas douradas
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 8;
                
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 215, 0, ${effect.alpha})`;
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }
    
    drawSpecialAbilityCooldown() {
        // Posição do indicador (canto inferior direito)
        const x = this.canvas.width - 80;
        const y = this.canvas.height - 80;
        const radius = 25;
        
        this.ctx.save();
        
        // Fundo do círculo
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Usar cooldown do hook se estiver no modo Grabber
        const cooldown = this.grabberMode.active ? this.grabberMode.hookCooldown : this.specialAbility.cooldown;
        const maxCooldown = this.grabberMode.active ? this.grabberMode.maxHookCooldown : this.specialAbility.maxCooldown;
        const abilityColor = this.grabberMode.active ? '#FFD700' : '#00FF00';
        
        // Texto Q
        this.ctx.fillStyle = cooldown > 0 ? '#666' : '#FFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Q', x, y);
        
        // Se em cooldown, desenhar progresso
        if (cooldown > 0) {
            const progress = 1 - (cooldown / maxCooldown);
            const startAngle = -Math.PI / 2; // Começar do topo
            const endAngle = startAngle + (progress * Math.PI * 2);
            
            // Arco de progresso
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius - 3, startAngle, endAngle);
            this.ctx.strokeStyle = abilityColor;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // Texto do tempo restante
            const timeLeft = Math.ceil(cooldown / 60); // Converter frames para segundos
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(timeLeft + 's', x, y + 15);
        } else {
            // Disponível - efeito brilhante
            this.ctx.shadowColor = abilityColor;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius - 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = abilityColor;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawDashAbilityCooldown() {
        const x = 120; // Posição horizontal (ao lado do Q)
        const y = 30;  // Posição vertical (mesmo nível do Q)
        const radius = 20;
        
        this.ctx.save();
        
        // Círculo base
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Texto E
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('E', x, y + 5);
        
        if (this.dashAbility.cooldown > 0) {
            // Em cooldown - mostrar progresso
            const progress = (this.dashAbility.maxCooldown - this.dashAbility.cooldown) / this.dashAbility.maxCooldown;
            const startAngle = -Math.PI / 2; // Começar do topo
            const endAngle = startAngle + (progress * Math.PI * 2);
            
            // Arco de progresso
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius - 3, startAngle, endAngle);
            this.ctx.strokeStyle = '#FFD700'; // Dourado para dash
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // Texto do tempo restante
            const timeLeft = Math.ceil(this.dashAbility.cooldown / 60); // Converter frames para segundos
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(timeLeft + 's', x, y + 15);
        } else {
            // Disponível - efeito brilhante dourado
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius - 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    cleanupMemory() {
        // Limitar número de inimigos em tela
        if (this.enemies.length > 50) {
            this.enemies = this.enemies.slice(0, 50);
        }
        
        // Limitar número de balas
        if (this.bullets.length > 100) {
            this.bullets = this.bullets.slice(0, 100);
        }
        
        // Limitar número de balas inimigas
        if (this.enemyBullets.length > 100) {
            this.enemyBullets = this.enemyBullets.slice(0, 100);
        }
        
        // Limitar projéteis especiais mais agressivamente
        if (this.specialAbility.projectiles.length > 3) {
            this.specialAbility.projectiles = this.specialAbility.projectiles.slice(0, 3);
        }
        
        // Limpar projéteis especiais inválidos
        this.specialAbility.projectiles = this.specialAbility.projectiles.filter(p => {
            return p && !isNaN(p.x) && !isNaN(p.y) && p.life > 0;
        });
        
        // Limpar rastros muito longos dos inimigos
        this.enemies.forEach(enemy => {
            if (enemy.trail && enemy.trail.length > 8) {
                enemy.trail = enemy.trail.slice(-8);
            }
        });
        
        // Limpar rastro do jogador
        if (this.player.trail && this.player.trail.length > 10) {
            this.player.trail = this.player.trail.slice(-10);
        }
        
        // Limpar efeitos de clique antigos
        if (this.clickEffects && this.clickEffects.length > 15) {
            this.clickEffects = this.clickEffects.slice(0, 15);
        }
        
        // Limpar efeitos de lançamento da habilidade especial
        if (this.specialAbilityCastEffects && this.specialAbilityCastEffects.length > 5) {
            this.specialAbilityCastEffects = this.specialAbilityCastEffects.slice(0, 5);
        }
        
        // Limpar efeitos de impacto mágico
        if (this.magicalImpactEffects && this.magicalImpactEffects.length > 20) {
            this.magicalImpactEffects = this.magicalImpactEffects.slice(0, 20);
        }
        
        // Limpar rastros dos projéteis especiais
        this.specialAbility.projectiles.forEach(projectile => {
            if (projectile.trail && projectile.trail.length > 5) {
                projectile.trail = projectile.trail.slice(-5);
            }
        });
    }
    
    setupEventListeners() {
        this.playButton.addEventListener('click', () => {
            this.startGame();
        });
        
        this.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
        
        // Eventos da tela de boas-vindas
        this.startGameButton.addEventListener('click', () => {
            this.handleWelcomeSubmit();
        });
        
        this.nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleWelcomeSubmit();
            }
        });
        
        this.nicknameInput.addEventListener('input', () => {
            this.validateNicknameInput();
        });
        
        // Botão para trocar nickname
        this.changeNicknameBtn.addEventListener('click', () => {
            this.showChangeNicknameDialog();
        });
        
        // Event listeners para o menu superior dos inimigos
        const enemiesMenuToggle = document.getElementById('enemiesMenuToggle');
        const enemiesMenuContainer = document.getElementById('enemiesMenuContainer');
        const enemiesGuideButton = document.getElementById('enemiesGuideButton');
        
        // Toggle do menu superior
        enemiesMenuToggle.addEventListener('click', () => {
            this.toggleEnemiesMenu();
        });
        
        // Botão do guia acima do jogo
        enemiesGuideButton.addEventListener('click', () => {
            this.toggleEnemiesMenu();
        });
        
        // Fechar menu com tecla ESC e habilidade especial com Q
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && enemiesMenuContainer.classList.contains('expanded')) {
                this.toggleEnemiesMenu();
            }
            
            // Smite no modo Jungler
            if ((e.key === 'f' || e.key === 'F') && this.junglerGame.active) {
                this.attemptSmite();
            }
            
            // Habilidade especial com Q
            if (e.key === 'q' || e.key === 'Q') {
                if (this.grabberMode.active && !this.gameOver) {
                    this.useGrabberHook();
                } else if (this.gameStarted && !this.gameOver) {
                    this.useSpecialAbility();
                }
            }
            
            // Habilidade de dash com E
            if (e.key === 'e' || e.key === 'E') {
                if (this.gameStarted && !this.gameOver) {
                    this.useDashAbility();
                }
            }
        });
        
        // Fechar menu ao clicar fora (opcional)
        document.addEventListener('click', (e) => {
            if (enemiesMenuContainer.classList.contains('expanded') && 
                !enemiesMenuContainer.contains(e.target) && 
                !enemiesMenuToggle.contains(e.target) &&
                !enemiesGuideButton.contains(e.target)) {
                this.closeEnemiesMenu();
            }
        });
        
        // Event listeners para os círculos de toggle de inimigos
        const enemyToggleCircles = document.querySelectorAll('.enemy-toggle-circle');
        enemyToggleCircles.forEach(circle => {
            circle.addEventListener('click', (e) => {
                this.handleEnemyToggle(e);
            });
        });
        
        // Carregar configurações salvas de inimigos
        this.loadEnemySettings();
        
        // Event listeners para os cards de modo
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('active')) {
                    const mode = card.getAttribute('data-mode');
                    this.selectedMode = mode;
                    this.hideModeSelection();
                }
            });
        });
        
        // Event listener para sair do modo Jungler
        this.junglerExitBtn.addEventListener('click', () => {
            this.exitJunglerMode();
        });
        
        // Event listener para sair do modo Laner
        this.lanerExitBtn.addEventListener('click', () => {
            this.exitLanerMode();
        });
        
        // Desabilitar clique direito em toda a página
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameStarted && !this.gameOver) {
                this.handleRightClick(e);
            }
        });
                    
                    this.canvas.addEventListener('mousemove', (e) => {
                        const rect = this.canvas.getBoundingClientRect();
                        this.cursor.x = e.clientX - rect.left;
                        this.cursor.y = e.clientY - rect.top;
                        this.cursor.visible = true;
                        
                        if (this.gameStarted && !this.gameOver) {
                            this.updateMousePosition(e);
                            this.updateCursorState();
                        }
                    });
                    
                    this.canvas.addEventListener('mouseenter', () => {
                        this.cursor.visible = true;
                    });
                    
                    this.canvas.addEventListener('mouseleave', () => {
                        this.cursor.visible = false;
                    });
                }
                
                handleWelcomeSubmit() {
                    const nickname = this.nicknameInput.value.trim();
                    
                    if (nickname.length === 0) {
                        this.showNicknameError('Por favor, digite um nickname!');
                        return;
                    }
                    
                    if (nickname.length < 2) {
                        this.showNicknameError('Nickname deve ter pelo menos 2 caracteres!');
                        return;
                    }
                    
                    this.playerNickname = nickname;
                    
                    // Salvar nickname no localStorage
                    localStorage.setItem('kitingback_nickname', nickname);
                    
                    this.hideWelcomeScreen();
                }
                
                validateNicknameInput() {
                    const nickname = this.nicknameInput.value.trim();
                    const button = this.startGameButton;
                    
                    if (nickname.length >= 2) {
                        button.disabled = false;
                        button.textContent = 'Iniciar';
                    } else {
                        button.disabled = true;
                        button.textContent = 'Digite um nickname válido';
                    }
                }
                
                showNicknameError(message) {
                    const button = this.startGameButton;
                    const originalText = button.textContent;
                    button.textContent = `⚠️ ${message}`;
                    button.style.background = 'linear-gradient(135deg, #ff4444, #cc3333)';
                    
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                    }, 2000);
                }
                
                hideWelcomeScreen(skipAnimation = false) {
                    if (skipAnimation) {
                        // Pular animação se já temos nickname salvo
                        this.welcomeScreen.style.display = 'none';
                        this.showModeSelection();
                    } else {
                        // Animação normal
                        this.welcomeScreen.style.opacity = '0';
                        this.welcomeScreen.style.transform = 'scale(0.9)';
                        this.welcomeScreen.style.transition = 'all 0.5s ease';
                        
                        setTimeout(() => {
                            this.welcomeScreen.style.display = 'none';
                            this.showModeSelection();
                        }, 500);
                    }
                }
                
                showModeSelection() {
                    this.modeSelectionScreen.style.display = 'flex';
                    this.modeSelectionScreen.style.opacity = '0';
                    this.modeSelectionScreen.style.transform = 'scale(0.9)';
                    this.modeSelectionScreen.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        this.modeSelectionScreen.style.opacity = '1';
                        this.modeSelectionScreen.style.transform = 'scale(1)';
                    }, 100);
                }
                
                hideModeSelection() {
                    this.modeSelectionScreen.style.opacity = '0';
                    this.modeSelectionScreen.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        this.modeSelectionScreen.style.display = 'none';
                        
                        // Iniciar o jogo apropriado baseado no modo selecionado
                        if (this.selectedMode === 'laner') {
                            this.showMainMenu();
                        } else if (this.selectedMode === 'jungler') {
                            this.startJunglerMode();
                        } else if (this.selectedMode === 'grabber') {
                            this.startGrabberMode();
                        }
                    }, 500);
                }
                
                showMainMenu() {
                    this.playButton.style.display = 'block';
                    this.playButton.style.opacity = '0';
                    this.playButton.style.transform = 'translate(-50%, -50%) scale(0.8)';
                    this.playButton.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        this.playButton.style.opacity = '1';
                        this.playButton.style.transform = 'translate(-50%, -50%) scale(1)';
                    }, 100);
                }
                
                startGame() {
                    this.gameStarted = true;
                    this.gameOver = false;
                    this.score = 0;
                    this.enemies = [];
                    this.bullets = [];
                    this.enemyBullets = [];
                    this.enemySpawnTimer = 0;
                    this.enemySpawnRate = 180; // Reset spawn rate
                    this.maxEnemiesOnScreen = 3; // Reset max enemies
                    this.killsForUpgrade = 10; // Reset upgrade counter
                    this.player.x = 400;
                    this.player.y = 300;
                    this.player.targetX = 400;
                    this.player.targetY = 300;
                    this.player.isMoving = false;
                    this.player.isShooting = false;
                    this.player.shootTarget = null;
                    this.player.shootCooldown = 0;
                    this.player.health = this.player.maxHealth;
                    this.player.trail = [];
                    this.player.angle = 0; // Reset da rotação
                    
                    // Ativar cursor customizado
                    this.canvas.classList.add('game-active');
                    
                    this.playButton.style.display = 'none';
                    this.gameOverScreen.style.display = 'none';
                    this.uiOverlay.style.display = 'block';
                    this.instructionsPanel.style.display = 'block';
                    this.updateInstructionsPanel(); // Atualizar instruções baseado no modo
                    this.instructions.style.display = 'none';
                    this.statusElement.textContent = 'Jogo iniciado!';
                    this.scoreElement.textContent = '0';
                    this.enemyCountElement.textContent = '0';
                    this.maxEnemiesElement.textContent = this.maxEnemiesOnScreen;
                    this.nextUpgradeElement.textContent = this.killsForUpgrade;
                    this.playerHealthElement.textContent = `${this.player.health}/${this.player.maxHealth}`;
                    this.playerNameElement.textContent = this.playerNickname;
                }
                
                restartGame() {
                    this.startGame();
                }
                
                handleRightClick(e) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // FASE 1: Procurar inimigos próximos ao clique (PRIORIDADE MÁXIMA)
                    let clickedEnemy = null;
                    let closestEnemyDistance = Infinity;
                    
                    // Buscar o inimigo mais próximo ao clique (área generosa)
                    for (let i = 0; i < this.enemies.length; i++) {
                        const enemy = this.enemies[i];
                        
                        // Cache das propriedades da imagem
                        const enemyImage = this.enemyImages[enemy.type];
                        const imageLoaded = this.enemyImagesLoaded[enemy.type];
                        
                        let isWithinClickArea = false;
                        
                        if (enemyImage && imageLoaded) {
                            // Área de clique generosa baseada na imagem
                            const imageSize = enemy.size * 2;
                            const halfSize = imageSize / 2;
                            const clickMargin = 25; // Área bem generosa para priorizar inimigos
                            
                            const relativeX = x - enemy.x;
                            const relativeY = y - enemy.y;
                            const distanceSquared = relativeX * relativeX + relativeY * relativeY;
                            const boundarySquared = (halfSize + clickMargin) * (halfSize + clickMargin);
                            isWithinClickArea = distanceSquared <= boundarySquared;
                        } else {
                            // Fallback: área circular generosa
                            const dx = x - enemy.x;
                            const dy = y - enemy.y;
                            const distanceSquared = dx * dx + dy * dy;
                            const boundarySquared = (enemy.size + 30) * (enemy.size + 30);
                            isWithinClickArea = distanceSquared <= boundarySquared;
                        }
                        
                        if (isWithinClickArea) {
                            const clickDistance = Math.sqrt((x - enemy.x) * (x - enemy.x) + (y - enemy.y) * (y - enemy.y));
                            if (clickDistance < closestEnemyDistance) {
                                closestEnemyDistance = clickDistance;
                                clickedEnemy = enemy;
                            }
                        }
                    }
                    
                    // FASE 2: Se encontrou inimigo, processar interação
                    if (clickedEnemy) {
                        const enemy = clickedEnemy;
                        
                        // Verificar se o inimigo tem a propriedade clickEffect (segurança)
                        if (!enemy.clickEffect) {
                            enemy.clickEffect = {
                                active: false,
                                timer: 0,
                                maxTimer: 30,
                                duration: 30
                            };
                        }
                        
                        // Ativar efeito visual instantaneamente
                        enemy.clickEffect.active = true;
                        enemy.clickEffect.timer = enemy.clickEffect.maxTimer;
                        
                        // Calcular distância do player ao inimigo
                        const dx = this.player.x - enemy.x;
                        const dy = this.player.y - enemy.y;
                        const shootDistanceSquared = dx * dx + dy * dy;
                        const shootRangeSquared = this.player.shootRange * this.player.shootRange;
                        
                        if (shootDistanceSquared <= shootRangeSquared) {
                            // CASO A: Inimigo dentro do range - atirar imediatamente
                            this.player.isMoving = false;
                            this.player.isShooting = !this.grabberMode.active; // Desativar animação em modo grabber
                            this.player.shootTarget = enemy;
                            this.player.moveTarget = null; // Cancelar movimento
                            
                            // Calcular ângulo para o inimigo
                            this.player.angle = Math.atan2(-dy, -dx);
                            
                            // Efeito de mira
                            this.clickEffect.x = enemy.x;
                            this.clickEffect.y = enemy.y;
                            this.clickEffect.radius = 0;
                            this.clickEffect.active = true;
                            this.clickEffect.alpha = 1;
                            
                            this.statusElement.textContent = 'Atirando no inimigo!';
                        } else {
                            // CASO B: Inimigo fora do range - mover para atacar
                            this.player.isShooting = false;
                            this.player.shootTarget = null;
                            this.player.isMoving = true;
                            this.player.moveTarget = enemy; // Seguir o inimigo
                            
                            // Calcular posição ideal para atacar (um pouco antes do range máximo)
                            const optimalDistance = this.player.shootRange * 0.8; // 80% do range máximo
                            const currentDistance = Math.sqrt(shootDistanceSquared);
                            const ratio = optimalDistance / currentDistance;
                            
                            this.player.targetX = enemy.x + (dx * ratio);
                            this.player.targetY = enemy.y + (dy * ratio);
                            
                            // Calcular ângulo de movimento
                            const moveDx = this.player.targetX - this.player.x;
                            const moveDy = this.player.targetY - this.player.y;
                            this.player.angle = Math.atan2(moveDy, moveDx);
                            
                            // Efeito visual indicando movimento para atacar
                            this.clickEffect.x = enemy.x;
                            this.clickEffect.y = enemy.y;
                            this.clickEffect.radius = 0;
                            this.clickEffect.active = true;
                            this.clickEffect.alpha = 1;
                            
                            this.statusElement.textContent = 'Movendo para atacar inimigo!';
                        }
                        
                        return; // Inimigo sempre tem prioridade - não processar movimento normal
                    }
                    
                    // FASE 3: Se não clicou em inimigo, movimento normal
                    this.player.targetX = x;
                    this.player.targetY = y;
                    this.player.isMoving = true;
                    this.player.isShooting = false;
                    this.player.shootTarget = null;
                    this.player.moveTarget = null;
                    
                    // Calcular ângulo de rotação do personagem
                    const dx = x - this.player.x;
                    const dy = y - this.player.y;
                    this.player.angle = Math.atan2(dy, dx);
                    
                    // Efeito de clique de movimento
                    this.clickEffect.x = x;
                    this.clickEffect.y = y;
                    this.clickEffect.radius = 0;
                    this.clickEffect.active = true;
                    this.clickEffect.alpha = 1;
                    
                    this.statusElement.textContent = 'Movendo...';
                }
                
                updateMousePosition(e) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.positionElement.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
                }
                
                updateCursorState() {
                    if (!this.gameStarted || this.gameOver) return;
                    
                    this.cursor.targetEnemy = null;
                    this.cursor.inRange = false;
                    
                    // Verificar se o mouse está sobre um inimigo
                    for (let enemy of this.enemies) {
                        const distance = Math.sqrt((this.cursor.x - enemy.x) ** 2 + (this.cursor.y - enemy.y) ** 2);
                        
                        if (distance <= enemy.size + 10) { // Hitbox aumentado
                            this.cursor.targetEnemy = enemy;
                            
                            // Verificar se está no range de tiro
                            const shootDistance = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
                            this.cursor.inRange = shootDistance <= this.player.shootRange;
                            break;
                        }
                    }
                }
                
                updatePlayer() {
                    // Atualizar cooldown de tiro
                    if (this.player.shootCooldown > 0) {
                        this.player.shootCooldown--;
                    }
                    
                    // Sistema de stamina - regeneração contínua
                    if (this.player.stamina < this.player.maxStamina) {
                        this.player.stamina = Math.min(
                            this.player.maxStamina, 
                            this.player.stamina + this.player.staminaRegenRate
                        );
                    }
                    
                    // Atualizar status de tiro baseado na stamina
                    this.player.canShoot = this.player.stamina >= this.player.staminaCostPerShot;
                    
                    // SISTEMA DE SEGUIMENTO DE INIMIGO (nova funcionalidade)
                    if (this.player.moveTarget && this.enemies.includes(this.player.moveTarget)) {
                        const enemy = this.player.moveTarget;
                        const dx = this.player.x - enemy.x;
                        const dy = this.player.y - enemy.y;
                        const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
                        
                        // Verificar se chegou no range de tiro
                        if (distanceToEnemy <= this.player.shootRange * 0.9) {
                            // Chegou próximo o suficiente - começar a atirar
                            this.player.isMoving = false;
                            this.player.isShooting = !this.grabberMode.active; // Desativar animação em modo grabber
                            this.player.shootTarget = enemy;
                            this.player.moveTarget = null;
                            
                            // Ajustar ângulo para o inimigo
                            this.player.angle = Math.atan2(-dy, -dx);
                            this.statusElement.textContent = 'Atirando no inimigo!';
                        } else {
                            // Ainda precisa se aproximar - atualizar posição alvo
                            const optimalDistance = this.player.shootRange * 0.8;
                            const ratio = optimalDistance / distanceToEnemy;
                            
                            this.player.targetX = enemy.x + (dx * ratio);
                            this.player.targetY = enemy.y + (dy * ratio);
                            this.player.isMoving = true;
                            this.statusElement.textContent = 'Perseguindo inimigo...';
                        }
                    } else if (this.player.moveTarget) {
                        // Inimigo alvo não existe mais - parar seguimento
                        this.player.moveTarget = null;
                        this.player.isMoving = false;
                        this.statusElement.textContent = 'Alvo perdido';
                    }
                    
                    // Sistema de tiro
                    if (this.player.isShooting && this.player.shootTarget && 
                        this.player.shootCooldown === 0 && this.player.canShoot) {
                        // Verificar se o alvo ainda existe e está no range
                        if (this.enemies.includes(this.player.shootTarget)) {
                            const distance = Math.sqrt(
                                (this.player.x - this.player.shootTarget.x) ** 2 + 
                                (this.player.y - this.player.shootTarget.y) ** 2
                            );
                            
                            if (distance <= this.player.shootRange) {
                                this.shootBullet(this.player.shootTarget);
                                this.player.shootCooldown = this.player.maxShootCooldown;
                                
                                // Consumir stamina
                                this.player.stamina = Math.max(0, this.player.stamina - this.player.staminaCostPerShot);
                                this.player.canShoot = false; // Forçar espera pela regeneração
                                
                                // Manter ângulo apontado para o inimigo
                                const dx = this.player.shootTarget.x - this.player.x;
                                const dy = this.player.shootTarget.y - this.player.y;
                                this.player.angle = Math.atan2(dy, dx);
                            } else {
                                // Alvo fora do range - tentar seguir novamente
                                this.player.isShooting = false;
                                this.player.shootTarget = null;
                                this.player.moveTarget = this.player.shootTarget; // Voltar a seguir
                                this.statusElement.textContent = 'Inimigo fugiu - perseguindo...';
                            }
                        } else {
                            // Alvo não existe mais, parar de atirar
                            this.player.isShooting = false;
                            this.player.shootTarget = null;
                            this.statusElement.textContent = 'Parado';
                        }
                    } else if (this.player.isShooting && this.player.shootTarget && !this.player.canShoot) {
                        // Quer atirar mas não tem stamina
                        this.statusElement.textContent = 'Carregando tiro...';
                    }
                    
                    // Sistema de movimento (só move se não estiver atirando)
                    if (this.player.isMoving && !this.player.isShooting) {
                        const dx = this.player.targetX - this.player.x;
                        const dy = this.player.targetY - this.player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 2) {
                            // Adicionar posição atual ao rastro
                            this.player.trail.push({
                                x: this.player.x,
                                y: this.player.y,
                                alpha: 1
                            });
                            
                            // Limitar tamanho do rastro
                            if (this.player.trail.length > 10) {
                                this.player.trail.shift();
                            }
                            
                            // Mover player
                            this.player.x += (dx / distance) * this.player.speed;
                            this.player.y += (dy / distance) * this.player.speed;
                        } else {
                            this.player.x = this.player.targetX;
                            this.player.y = this.player.targetY;
                            this.player.isMoving = false;
                            this.statusElement.textContent = 'Parado';
                        }
                    }
                    
                    // Atualizar rastro
                    this.player.trail.forEach(point => {
                        point.alpha -= 0.05;
                    });
                    this.player.trail = this.player.trail.filter(point => point.alpha > 0);
                }
                
                shootBullet(target) {
                    const bullet = {
                        x: this.player.x,
                        y: this.player.y,
                        startX: this.player.x,
                        startY: this.player.y,
                        targetX: target.x,
                        targetY: target.y,
                        speed: 12, // Mais rápido
                        size: 4,
                        color: '#FFD700',
                        active: true,
                        trail: [], // Rastro do feixe
                        energy: 1.0, // Energia do feixe (diminui com o tempo)
                        particles: [] // Partículas do feixe
                    };
                    
                    // Calcular direção
                    const dx = target.x - this.player.x;
                    const dy = target.y - this.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    bullet.velocityX = (dx / distance) * bullet.speed;
                    bullet.velocityY = (dy / distance) * bullet.speed;
                    bullet.angle = Math.atan2(dy, dx);
                    
                    // Criar partículas iniciais do feixe
                    for (let i = 0; i < 8; i++) {
                        bullet.particles.push({
                            x: this.player.x + (Math.random() - 0.5) * 6,
                            y: this.player.y + (Math.random() - 0.5) * 6,
                            vx: bullet.velocityX + (Math.random() - 0.5) * 2,
                            vy: bullet.velocityY + (Math.random() - 0.5) * 2,
                            life: 1.0,
                            size: Math.random() * 3 + 1
                        });
                    }
                    
                    this.bullets.push(bullet);
                }
                
                updateBullets() {
                    for (let i = this.bullets.length - 1; i >= 0; i--) {
                        const bullet = this.bullets[i];
                        
                        if (!bullet.active) {
                            this.bullets.splice(i, 1);
                            continue;
                        }
                        
                        // Mover bala
                        bullet.x += bullet.velocityX;
                        bullet.y += bullet.velocityY;
                        
                        // Adicionar posição atual ao rastro
                        bullet.trail.unshift({ x: bullet.x, y: bullet.y, alpha: 1.0 });
                        if (bullet.trail.length > 15) {
                            bullet.trail.pop();
                        }
                        
                        // Atualizar rastro
                        bullet.trail.forEach((point, index) => {
                            point.alpha = (bullet.trail.length - index) / bullet.trail.length;
                        });
                        
                        // Diminuir energia do feixe
                        bullet.energy -= 0.01;
                        
                        // Atualizar partículas
                        bullet.particles.forEach(particle => {
                            particle.x += particle.vx * 0.5;
                            particle.y += particle.vy * 0.5;
                            particle.life -= 0.05;
                            particle.size *= 0.98;
                        });
                        
                        // Remover partículas mortas
                        bullet.particles = bullet.particles.filter(p => p.life > 0);
                        
                        // Adicionar novas partículas
                        if (bullet.particles.length < 6) {
                            bullet.particles.push({
                                x: bullet.x + (Math.random() - 0.5) * 4,
                                y: bullet.y + (Math.random() - 0.5) * 4,
                                vx: (Math.random() - 0.5) * 3,
                                vy: (Math.random() - 0.5) * 3,
                                life: 1.0,
                                size: Math.random() * 2 + 1
                            });
                        }
                        
                        // Verificar colisão com inimigos
                        for (let j = this.enemies.length - 1; j >= 0; j--) {
                            const enemy = this.enemies[j];
                            const distance = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
                            
                            if (distance < bullet.size + enemy.size) {
                                // Bala atingiu inimigo
                                bullet.active = false;
                                enemy.health--;
                                
                                // Efeito de impacto melhorado
                                this.createLightImpactEffect(enemy.x, enemy.y);
                                
                                if (enemy.health <= 0) {
                                    // Inimigo morreu
                                    this.enemies.splice(j, 1);
                                    this.score += 1; // 1 ponto por inimigo morto, independente do tipo
                                    this.scoreElement.textContent = this.score;
                                    this.enemyCountElement.textContent = this.enemies.length;
                                    
                                    // Verificar se deve aumentar a dificuldade
                                    this.checkUpgrade();
                                    
                                    // Se era o alvo atual, parar de atirar
                                    if (this.player.shootTarget === enemy) {
                                        this.player.isShooting = false;
                                        this.player.shootTarget = null;
                                        this.statusElement.textContent = 'Inimigo eliminado!';
                                    }
                                }
                                break;
                            }
                        }
                        
                        // Remover bala se saiu da tela ou perdeu energia
                        if (bullet.x < -50 || bullet.x > this.canvas.width + 50 || 
                            bullet.y < -50 || bullet.y > this.canvas.height + 50 || 
                            bullet.energy <= 0) {
                            bullet.active = false;
                        }
                    }
                }
                
                updateEnemyBullets() {
                    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                        const bullet = this.enemyBullets[i];
                        
                        if (!bullet.active) {
                            this.enemyBullets.splice(i, 1);
                            continue;
                        }
                        
                        // Mover bala
                        bullet.x += bullet.velocityX;
                        bullet.y += bullet.velocityY;
                        
                        // Adicionar rastro para balas do sniper
                        if (bullet.type === 'sniper') {
                            // Adicionar posição atual ao rastro
                            bullet.trail.unshift({ 
                                x: bullet.x, 
                                y: bullet.y, 
                                alpha: 1.0,
                                size: bullet.size 
                            });
                            
                            // Limitar tamanho do rastro (maior para sniper)
                            if (bullet.trail.length > 25) {
                                bullet.trail.pop();
                            }
                            
                            // Atualizar rastro
                            bullet.trail.forEach((point, index) => {
                                point.alpha = (bullet.trail.length - index) / bullet.trail.length;
                                point.size = bullet.size * point.alpha;
                            });
                            
                            // Diminuir energia da bala
                            bullet.energy -= 0.005;
                            
                            // Atualizar partículas
                            if (bullet.particles) {
                                bullet.particles.forEach(particle => {
                                    particle.x += particle.vx * 0.5;
                                    particle.y += particle.vy * 0.5;
                                    particle.life -= 0.03;
                                    particle.size *= 0.99;
                                });
                                
                                // Remover partículas mortas
                                bullet.particles = bullet.particles.filter(p => p.life > 0);
                                
                                // Adicionar novas partículas
                                if (bullet.particles.length < 3) {
                                    bullet.particles.push({
                                        x: bullet.x + (Math.random() - 0.5) * 3,
                                        y: bullet.y + (Math.random() - 0.5) * 3,
                                        vx: (Math.random() - 0.5) * 2,
                                        vy: (Math.random() - 0.5) * 2,
                                        life: 1.0,
                                        size: Math.random() * 1.5 + 0.5
                                    });
                                }
                            }
                        }
                        
                        // Verificar colisão com o jogador
                        const distance = Math.sqrt((bullet.x - this.player.x) ** 2 + (bullet.y - this.player.y) ** 2);
                        
                        if (distance < bullet.size + this.player.size) {
                            // Ignorar dano se estiver no modo Grabber (invencível)
                            if (this.grabberMode.active) {
                                bullet.active = false; // Remover a bala mas não causar dano
                                break;
                            }
                            
                            // Bala atingiu jogador
                            bullet.active = false;
                            this.player.health--;
                            this.playerHealthElement.textContent = `${this.player.health}/${this.player.maxHealth}`;
                            
                            // Efeito de impacto no jogador
                            this.createImpactEffect(this.player.x, this.player.y);
                            
                            if (this.player.health <= 0) {
                                this.endGame();
                            } else {
                                this.statusElement.textContent = `Atingido! Vida: ${this.player.health}`;
                            }
                            break;
                        }
                        
                        // Remover bala se saiu da tela
                        if (bullet.x < 0 || bullet.x > this.canvas.width || 
                            bullet.y < 0 || bullet.y > this.canvas.height) {
                            bullet.active = false;
                        }
                    }
                }
                
                createImpactEffect(x, y) {
                    // Criar efeito visual de impacto
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            this.clickEffect.x = x + (Math.random() - 0.5) * 10;
                            this.clickEffect.y = y + (Math.random() - 0.5) * 10;
                            this.clickEffect.radius = 0;
                            this.clickEffect.active = true;
                            this.clickEffect.alpha = 0.8;
                        }, i * 50);
                    }
                }
                
                createLightImpactEffect(x, y) {
                    // Criar efeito visual de impacto de luz melhorado
                    for (let i = 0; i < 12; i++) {
                        setTimeout(() => {
                            // Múltiplos efeitos de luz
                            this.clickEffect.x = x + (Math.random() - 0.5) * 15;
                            this.clickEffect.y = y + (Math.random() - 0.5) * 15;
                            this.clickEffect.radius = 0;
                            this.clickEffect.maxRadius = 20 + Math.random() * 15;
                            this.clickEffect.active = true;
                            this.clickEffect.alpha = 0.9;
                        }, i * 25);
                    }
                }
                
                checkUpgrade() {
                    // A cada 10 kills, aumentar a quantidade máxima de inimigos
                    if (this.score > 0 && this.score % 10 === 0) {
                        this.maxEnemiesOnScreen++;
                        this.killsForUpgrade = this.score + 10; // Próximo upgrade
                        this.maxEnemiesElement.textContent = this.maxEnemiesOnScreen;
                        this.nextUpgradeElement.textContent = this.killsForUpgrade;
                        
                        // Feedback visual
                        this.statusElement.textContent = `UPGRADE! Max inimigos: ${this.maxEnemiesOnScreen}`;
                    } else {
                        this.nextUpgradeElement.textContent = this.killsForUpgrade;
                    }
                }
                
                spawnEnemy() {
                    // Só spawnar se não atingiu o limite máximo
                    if (this.enemies.length >= this.maxEnemiesOnScreen) {
                        return;
                    }
                    
                    // Calcular agressividade baseada na pontuação
                    const aggressiveness = Math.min(this.score / 20, 2.0); // Máximo 2x mais agressivo
                    
                    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
                    let x, y;
                    
                    switch (side) {
                        case 0: // top
                            x = Math.random() * this.canvas.width;
                            y = -20;
                            break;
                        case 1: // right
                            x = this.canvas.width + 20;
                            y = Math.random() * this.canvas.height;
                            break;
                        case 2: // bottom
                            x = Math.random() * this.canvas.width;
                            y = this.canvas.height + 20;
                            break;
                        case 3: // left
                            x = -20;
                            y = Math.random() * this.canvas.height;
                            break;
                    }
                    
                    // Determinar tipo de inimigo baseado na pontuação e aleatoriedade
                    let enemyType = this.determineEnemyType();
                    let enemy = this.createEnemyByType(x, y, enemyType, aggressiveness);
                    
                    this.enemies.push(enemy);
                    this.enemyCountElement.textContent = this.enemies.length;
                }
                
                determineEnemyType() {
                    // No modo Grabber, apenas mages
                    if (this.grabberMode.active) {
                        return 'mage';
                    }
                    
                    // Filtrar apenas tipos habilitados
                    const availableTypes = [];
                    
                    // Coletar tipos disponíveis baseado APENAS nas configurações do usuário
                    // Remover restrições de pontuação para permitir escolha livre
                    
                    if (this.enabledEnemyTypes.fast) availableTypes.push('fast');
                    if (this.enabledEnemyTypes.tank) availableTypes.push('tank');
                    if (this.enabledEnemyTypes.sniper) availableTypes.push('sniper');
                    if (this.enabledEnemyTypes.berserker) availableTypes.push('berserker');
                    if (this.enabledEnemyTypes.mage) availableTypes.push('mage');
                    
                    // Se não há tipos disponíveis, forçar 'fast' como fallback
                    if (availableTypes.length === 0) {
                        return 'fast';
                    }
                    
                    // Se há apenas um tipo disponível, usá-lo diretamente
                    if (availableTypes.length === 1) {
                        return availableTypes[0];
                    }
                    
                    // Para múltiplos tipos, usar sistema de pesos baseado na pontuação
                    const score = this.score;
                    const weights = {};
                    
                    // Ajustar pesos baseados na pontuação, mas apenas para tipos disponíveis
                    if (score < 5) {
                        weights.fast = 0.7;
                        weights.tank = 0.2;
                        weights.sniper = 0.1;
                        weights.berserker = 0.05;
                        weights.mage = 0.05;
                    } else if (score < 15) {
                        weights.fast = 0.4;
                        weights.tank = 0.3;
                        weights.sniper = 0.2;
                        weights.berserker = 0.08;
                        weights.mage = 0.02;
                    } else if (score < 30) {
                        weights.fast = 0.25;
                        weights.tank = 0.25;
                        weights.sniper = 0.25;
                        weights.berserker = 0.2;
                        weights.mage = 0.05;
                    } else {
                        weights.fast = 0.2;
                        weights.tank = 0.2;
                        weights.sniper = 0.25;
                        weights.berserker = 0.25;
                        weights.mage = 0.1;
                    }
                    
                    // Calcular peso total apenas para tipos disponíveis
                    let totalWeight = 0;
                    for (const type of availableTypes) {
                        totalWeight += weights[type] || 0;
                    }
                    
                    // Selecionar tipo baseado nos pesos normalizados
                    const rand = Math.random();
                    let accumulator = 0;
                    
                    for (const type of availableTypes) {
                        const normalizedWeight = (weights[type] || 0) / totalWeight;
                        accumulator += normalizedWeight;
                        if (rand <= accumulator) {
                            return type;
                        }
                    }
                    
                    // Fallback para um tipo aleatório dos disponíveis
                    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
                }
                
                createEnemyByType(x, y, type, aggressiveness) {
                    const baseStats = {
                        x: x,
                        y: y,
                        trail: [],
                        shootCooldown: 0,
                        type: type,
                        behavior: type,
                        aggressiveness: aggressiveness,
                        lastDirectionChange: 0,
                        targetX: this.player.x,
                        targetY: this.player.y,
                        patrolAngle: Math.random() * Math.PI * 2,
                        rushCooldown: 0,
                        specialAbilityCooldown: 0,
                        angle: 0, // Ângulo para apontar para o jogador
                        clickEffect: {
                            active: false,
                            timer: 0,
                            maxTimer: 30, // 30 frames = 0.5 segundos
                            duration: 30
                        }
                    };
                    
                    switch (type) {
                        case 'basic':
                            return {
                                ...baseStats,
                                size: 18,
                                speed: (0.8 + Math.random() * 0.4) * (1 + aggressiveness * 0.3),
                                health: 3,
                                maxHealth: 3,
                                maxShootCooldown: Math.max(80, 120 - aggressiveness * 20),
                                shootRange: 180,
                                color: '#ff4444',
                                bulletSpeed: 4,
                                bulletSize: 4,
                                bulletColor: '#ff6666'
                            };
                            
                        case 'fast':
                            return {
                                ...baseStats,
                                size: 14,
                                speed: (1.5 + Math.random() * 0.8) * (1 + aggressiveness * 0.4),
                                health: 1,
                                maxHealth: 1,
                                maxShootCooldown: Math.max(60, 100 - aggressiveness * 15),
                                shootRange: 150,
                                color: '#ff8844',
                                bulletSpeed: 5,
                                bulletSize: 3,
                                bulletColor: '#ff9966'
                            };
                            
                        case 'tank':
                            return {
                                ...baseStats,
                                size: 24,
                                speed: (0.9 + Math.random() * 0.4) * (1 + aggressiveness * 0.25), // Velocidade reduzida
                                health: 8, // Aumentar vida já que é corpo a corpo
                                maxHealth: 8,
                                color: '#cc2222',
                                isCharging: false,
                                chargeDuration: 0,
                                pauseDuration: 0,
                                maxChargeDuration: 90, // 1.5 segundos correndo (60fps * 1.5) - reduzido pela metade
                                maxPauseDuration: 180,   // 3 segundos parado (60fps * 3)
                                isMelee: true // Marcador de corpo a corpo
                            };
                            
                        case 'sniper':
                            return {
                                ...baseStats,
                                size: 16,
                                speed: (0.6 + Math.random() * 0.4) * (1 + aggressiveness * 0.2),
                                health: 2,
                                maxHealth: 2,
                                maxShootCooldown: Math.max(120, 180 - aggressiveness * 30),
                                shootRange: 350,
                                color: '#8844ff',
                                bulletSpeed: 8,
                                bulletSize: 3,
                                bulletColor: '#aa66ff',
                                isCharging: false,
                                chargeTime: 0
                            };
                            
                        case 'berserker':
                            return {
                                ...baseStats,
                                size: 20,
                                speed: (0.8 + Math.random() * 0.4) * (1 + aggressiveness * 0.3), // Velocidade reduzida para não ser imortal
                                health: 3, // Reduzido para 3 hits
                                maxHealth: 3,
                                color: '#ff2244',
                                isRaging: false,
                                rageThreshold: 2,
                                isMelee: true // Marcador de corpo a corpo
                            };
                            
                        case 'elite':
                            return {
                                ...baseStats,
                                size: 22,
                                speed: (1.2 + Math.random() * 0.5) * (1 + aggressiveness * 0.4),
                                health: 5,
                                maxHealth: 5,
                                maxShootCooldown: Math.max(50, 90 - aggressiveness * 25),
                                shootRange: 250,
                                color: '#ff0088',
                                bulletSpeed: 7,
                                bulletSize: 5,
                                bulletColor: '#ff2299',
                                burstCount: 0,
                                maxBurst: 3,
                                burstCooldown: 0
                            };
                            
                        case 'mage':
                            const mageSpeed = this.grabberMode.active ? 
                                (2.5 + Math.random() * 1.5) : // Velocidade alta no modo Grabber
                                (0.8 + Math.random() * 0.4) * (1 + aggressiveness * 0.3);
                            
                            return {
                                ...baseStats,
                                size: 18,
                                speed: mageSpeed,
                                health: 3,
                                maxHealth: 3,
                                maxShootCooldown: Math.max(80, 120 - aggressiveness * 20),
                                shootRange: 280,
                                color: '#4488ff',
                                bulletSpeed: 4,
                                bulletSize: 4,
                                bulletColor: '#66aaff',
                                multiShot: true,
                                shotCount: 3,
                                // Movimento aleat\u00f3rio no modo Grabber
                                randomMovement: this.grabberMode.active,
                                randomMoveTimer: 0,
                                randomMoveDirection: { x: 0, y: 0 },
                                canShoot: !this.grabberMode.active // N\u00e3o atirar no modo Grabber
                            };
                            
                        default:
                            return this.createEnemyByType(x, y, 'fast', aggressiveness);
                    }
                }
                
                updateEnemies() {
                    this.enemies.forEach(enemy => {
                        // Atualizar cooldowns
                        if (enemy.shootCooldown > 0) enemy.shootCooldown--;
                        if (enemy.rushCooldown > 0) enemy.rushCooldown--;
                        if (enemy.specialAbilityCooldown > 0) enemy.specialAbilityCooldown--;
                        if (enemy.burstCooldown > 0) enemy.burstCooldown--;
                        
                        // Atualizar efeito de clique
                        if (enemy.clickEffect && enemy.clickEffect.timer > 0) {
                            enemy.clickEffect.timer--;
                            if (enemy.clickEffect.timer <= 0) {
                                enemy.clickEffect.active = false;
                            }
                        }
                        
                        // Calcular distância para o jogador
                        const distanceToPlayer = Math.sqrt(
                            (this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2
                        );
                        
                        // Calcular ângulo para apontar para o jogador
                        const dx = this.player.x - enemy.x;
                        const dy = this.player.y - enemy.y;
                        enemy.angle = Math.atan2(dy, dx);
                        
                        // Comportamentos específicos por tipo
                        this.updateEnemyBehavior(enemy, distanceToPlayer);
                        
                        // Sistema de tiro baseado no tipo
                        this.handleEnemyShooting(enemy, distanceToPlayer);
                        
                        // Movimento baseado no comportamento
                        this.moveEnemy(enemy, distanceToPlayer);
                        
                        // Atualizar rastro
                        this.updateEnemyTrail(enemy);
                    });
                    
                    // Verificar colisões com o player
                    this.enemies.forEach(enemy => {
                        // Ignorar colisão se o inimigo está sendo puxado pelo hook
                        if (enemy.beingPulled) {
                            return;
                        }
                        
                        // Ignorar colisão se estiver no modo Grabber (invencível)
                        if (this.grabberMode.active) {
                            return;
                        }
                        
                        const dx = this.player.x - enemy.x;
                        const dy = this.player.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < this.player.size + enemy.size - 5) {
                            this.endGame();
                        }
                    });
                }
                
                updateEnemyBehavior(enemy, distanceToPlayer) {
                    switch (enemy.type) {
                        case 'berserker':
                            // Fica mais agressivo quando ferido
                            if (enemy.health <= enemy.rageThreshold && !enemy.isRaging) {
                                enemy.isRaging = true;
                                enemy.speed *= 1.3; // Velocidade moderada quando em fúria para evitar imortalidade
                                enemy.color = '#ff0022';
                            }
                            break;
                            
                        case 'sniper':
                            // Sistema de mira carregada
                            if (distanceToPlayer <= enemy.shootRange && enemy.shootCooldown === 0) {
                                if (!enemy.isCharging) {
                                    enemy.isCharging = true;
                                    enemy.chargeTime = 60; // 1 segundo de mira
                                } else {
                                    enemy.chargeTime--;
                                }
                            } else {
                                enemy.isCharging = false;
                                enemy.chargeTime = 0;
                            }
                            break;
                            
                        case 'fast':
                            // Movimento errático para ser difícil de acertar
                            enemy.lastDirectionChange++;
                            if (enemy.lastDirectionChange > 30) {
                                enemy.patrolAngle += (Math.random() - 0.5) * 0.8;
                                enemy.lastDirectionChange = 0;
                            }
                            break;
                            
                        case 'tank':
                            // Novo comportamento: correr por 3s, parar por 3s
                            if (enemy.isCharging) {
                                // Tank está correndo
                                enemy.chargeDuration++;
                                enemy.color = '#ff4444'; // Cor vermelha quando correndo
                                
                                if (enemy.chargeDuration >= enemy.maxChargeDuration) {
                                    // Parar de correr
                                    enemy.isCharging = false;
                                    enemy.chargeDuration = 0;
                                    enemy.pauseDuration = 0;
                                    enemy.color = '#cc2222'; // Cor normal quando parado
                                }
                            } else {
                                // Tank está parado
                                enemy.pauseDuration++;
                                enemy.color = '#cc2222'; // Cor normal quando parado
                                
                                if (enemy.pauseDuration >= enemy.maxPauseDuration) {
                                    // Começar a correr
                                    enemy.isCharging = true;
                                    enemy.pauseDuration = 0;
                                    enemy.chargeDuration = 0;
                                }
                            }
                            break;
                            
                        case 'mage':
                            // Comportamento de multi-shot
                            if (distanceToPlayer <= enemy.shootRange && enemy.shootCooldown === 0) {
                                // Mage atira em rajada
                                enemy.multiShotTimer = enemy.multiShotTimer || 0;
                                enemy.shotsInBurst = enemy.shotsInBurst || 0;
                                
                                if (enemy.shotsInBurst < (enemy.shotCount || 3)) {
                                    if (enemy.multiShotTimer === 0) {
                                        enemy.multiShotTimer = 10; // Intervalo entre tiros da rajada
                                        enemy.shotsInBurst++;
                                    } else {
                                        enemy.multiShotTimer--;
                                    }
                                } else {
                                    // Reset após completar rajada
                                    enemy.shotsInBurst = 0;
                                    enemy.shootCooldown = enemy.maxShootCooldown;
                                }
                            }
                            break;
                            
                        case 'elite':
                            // Teleport ocasional
                            if (enemy.specialAbilityCooldown === 0 && Math.random() < 0.005) {
                                const angle = Math.random() * Math.PI * 2;
                                const distance = 150 + Math.random() * 100;
                                enemy.x = this.player.x + Math.cos(angle) * distance;
                                enemy.y = this.player.y + Math.sin(angle) * distance;
                                
                                // Manter dentro dos limites
                                enemy.x = Math.max(enemy.size, Math.min(this.canvas.width - enemy.size, enemy.x));
                                enemy.y = Math.max(enemy.size, Math.min(this.canvas.height - enemy.size, enemy.y));
                                
                                enemy.specialAbilityCooldown = 300; // 5 segundos
                                this.createTeleportEffect(enemy.x, enemy.y);
                            }
                            break;
                    }
                }
                
                handleEnemyShooting(enemy, distanceToPlayer) {
                    // N\u00e3o atirar se for modo grabber
                    if (this.grabberMode.active || enemy.canShoot === false) {
                        return;
                    }
                    
                    switch (enemy.type) {
                        case 'tank':
                        case 'berserker':
                            // Tank e Berserker são corpo a corpo - não atiram
                            break;
                            
                        case 'sniper':
                            if (enemy.isCharging && enemy.chargeTime <= 0 && enemy.shootCooldown === 0) {
                                this.enemyShoot(enemy);
                                enemy.shootCooldown = enemy.maxShootCooldown;
                                enemy.isCharging = false;
                            }
                            break;
                            
                        case 'mage':
                            // Mage com multi-shot
                            if (distanceToPlayer <= enemy.shootRange && enemy.shootCooldown === 0) {
                                if (enemy.shotsInBurst < (enemy.shotCount || 3)) {
                                    if (enemy.multiShotTimer === 0) {
                                        this.enemyShoot(enemy);
                                        enemy.multiShotTimer = 10;
                                        enemy.shotsInBurst++;
                                    }
                                } else {
                                    enemy.shotsInBurst = 0;
                                    enemy.shootCooldown = enemy.maxShootCooldown;
                                }
                            }
                            break;
                            
                        case 'elite':
                            // Tiro em rajada
                            if (distanceToPlayer <= enemy.shootRange && enemy.shootCooldown === 0) {
                                if (enemy.burstCount < enemy.maxBurst) {
                                    this.enemyShoot(enemy);
                                    enemy.burstCount++;
                                    enemy.shootCooldown = 15; // Intervalo entre tiros da rajada
                                } else {
                                    enemy.burstCount = 0;
                                    enemy.shootCooldown = enemy.maxShootCooldown;
                                }
                            }
                            break;
                            
                        default:
                            // Comportamento padrão de tiro
                            if (distanceToPlayer <= enemy.shootRange && enemy.shootCooldown === 0) {
                                this.enemyShoot(enemy);
                                enemy.shootCooldown = enemy.maxShootCooldown;
                            }
                            break;
                    }
                }
                
                moveEnemy(enemy, distanceToPlayer) {
                    // Movimento aleat\u00f3rio para mages no modo Grabber
                    if (enemy.randomMovement && this.grabberMode.active) {
                        enemy.randomMoveTimer = enemy.randomMoveTimer || 0;
                        enemy.randomMoveTimer--;
                        
                        if (enemy.randomMoveTimer <= 0 || !enemy.randomMoveDirection.x) {
                            // Novo dire\u00e7\u00e3o aleat\u00f3ria a cada 1-2 segundos
                            enemy.randomMoveTimer = 60 + Math.random() * 60;
                            const angle = Math.random() * Math.PI * 2;
                            enemy.randomMoveDirection = {
                                x: Math.cos(angle),
                                y: Math.sin(angle)
                            };
                        }
                        
                        enemy.x += enemy.randomMoveDirection.x * enemy.speed;
                        enemy.y += enemy.randomMoveDirection.y * enemy.speed;
                        
                        // Manter dentro dos limites
                        enemy.x = Math.max(enemy.size, Math.min(this.canvas.width - enemy.size, enemy.x));
                        enemy.y = Math.max(enemy.size, Math.min(this.canvas.height - enemy.size, enemy.y));
                        
                        return;
                    }
                    
                    let dx = this.player.x - enemy.x;
                    let dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        let moveSpeed = enemy.speed;
                        
                        // Modificações de movimento por tipo
                        switch (enemy.type) {
                            case 'fast':
                                // Movimento em zigzag
                                const zigzag = Math.sin(Date.now() * 0.01 + enemy.x * 0.01) * 50;
                                dx += Math.cos(enemy.patrolAngle) * zigzag;
                                dy += Math.sin(enemy.patrolAngle) * zigzag;
                                break;
                                
                            case 'sniper':
                                // Manter distância ótima
                                if (distanceToPlayer < enemy.shootRange * 0.8) {
                                    dx = -dx; // Fugir
                                    dy = -dy;
                                    moveSpeed *= 1.5;
                                } else if (distanceToPlayer > enemy.shootRange) {
                                    // Aproximar normalmente
                                } else {
                                    // Ficar parado para mirar
                                    moveSpeed *= 0.1;
                                }
                                break;
                                
                            case 'tank':
                                // Novo comportamento: move apenas quando está correndo
                                if (enemy.isCharging) {
                                    // Correndo em direção ao jogador - movimento mais lento
                                    moveSpeed *= 1.2; // Reduzido de 1.5 para 1.2 - mais lento
                                } else {
                                    // Parado - não se move
                                    moveSpeed = 0;
                                }
                                break;
                                
                            case 'berserker':
                                // Movimento mais direto quando enraivecido
                                if (enemy.isRaging) {
                                    moveSpeed *= 1.1; // Reduzido para evitar velocidade excessiva
                                }
                                break;
                        }
                        
                        // Calcular nova posição
                        const newDistance = Math.sqrt(dx * dx + dy * dy);
                        if (newDistance > 0) {
                            const newX = enemy.x + (dx / newDistance) * moveSpeed;
                            const newY = enemy.y + (dy / newDistance) * moveSpeed;
                            
                            // Verificar colisão com obstáculos (usando o sistema existente)
                            if (this.checkObstacleCollision) {
                                const collision = this.checkObstacleCollision(newX, newY, enemy.size);
                                
                                if (!collision) {
                                    enemy.x = newX;
                                    enemy.y = newY;
                                } else {
                                    // Sistema de contorno melhorado
                                    this.handleEnemyObstacleAvoidance(enemy, collision);
                                }
                            } else {
                                enemy.x = newX;
                                enemy.y = newY;
                            }
                        }
                    }
                }
                
                handleEnemyObstacleAvoidance(enemy, obstacle) {
                    // Contornar obstáculo de forma mais inteligente
                    const avoidanceStrength = enemy.type === 'fast' ? 3 : 2;
                    const avoidanceAngle = Math.random() * Math.PI * 2;
                    const avoidanceDistance = enemy.speed * avoidanceStrength;
                    
                    for (let attempts = 0; attempts < 8; attempts++) {
                        const angle = avoidanceAngle + (attempts * Math.PI / 4);
                        const avoidX = enemy.x + Math.cos(angle) * avoidanceDistance;
                        const avoidY = enemy.y + Math.sin(angle) * avoidanceDistance;
                        
                        if (!this.checkObstacleCollision(avoidX, avoidY, enemy.size) &&
                            avoidX > 0 && avoidX < this.canvas.width &&
                            avoidY > 0 && avoidY < this.canvas.height) {
                            enemy.x = avoidX;
                            enemy.y = avoidY;
                            break;
                        }
                    }
                }
                
                updateEnemyTrail(enemy) {
                    // Adicionar rastro do inimigo
                    enemy.trail.push({
                        x: enemy.x,
                        y: enemy.y,
                        alpha: 1
                    });
                    
                    const maxTrailLength = enemy.type === 'fast' ? 8 : 5;
                    if (enemy.trail.length > maxTrailLength) {
                        enemy.trail.shift();
                    }
                    
                    // Atualizar rastro do inimigo
                    enemy.trail.forEach(point => {
                        point.alpha -= enemy.type === 'fast' ? 0.15 : 0.1;
                    });
                    enemy.trail = enemy.trail.filter(point => point.alpha > 0);
                }
                
                createTeleportEffect(x, y) {
                    // Efeito visual de teleporte
                    for (let i = 0; i < 15; i++) {
                        setTimeout(() => {
                            this.clickEffect.x = x + (Math.random() - 0.5) * 30;
                            this.clickEffect.y = y + (Math.random() - 0.5) * 30;
                            this.clickEffect.radius = 0;
                            this.clickEffect.maxRadius = 25 + Math.random() * 20;
                            this.clickEffect.active = true;
                            this.clickEffect.alpha = 0.8;
                        }, i * 20);
                    }
                }
                
                enemyShoot(enemy) {
                    const bullet = {
                        x: enemy.x,
                        y: enemy.y,
                        speed: enemy.type === 'sniper' ? 8 : 4, // Sniper atira 2x mais rápido
                        size: enemy.type === 'sniper' ? 3 : 4, // Sniper tem bala menor mas mais rápida
                        color: enemy.type === 'sniper' ? '#ffaa00' : '#ff6666', // Sniper tem bala dourada
                        active: true,
                        type: enemy.type, // Identificar tipo da bala
                        trail: [], // Rastro para balas especiais
                        energy: 1.0 // Energia para efeitos visuais
                    };
                    
                    // Calcular direção para o jogador
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    bullet.velocityX = (dx / distance) * bullet.speed;
                    bullet.velocityY = (dy / distance) * bullet.speed;
                    
                    // Propriedades especiais para bala do sniper
                    if (enemy.type === 'sniper') {
                        bullet.angle = Math.atan2(dy, dx);
                        bullet.particles = []; // Partículas para efeito especial
                        
                        // Criar partículas iniciais para a bala do sniper
                        for (let i = 0; i < 5; i++) {
                            bullet.particles.push({
                                x: bullet.x + (Math.random() - 0.5) * 4,
                                y: bullet.y + (Math.random() - 0.5) * 4,
                                vx: (Math.random() - 0.5) * 2,
                                vy: (Math.random() - 0.5) * 2,
                                life: 1.0,
                                size: Math.random() * 2 + 1
                            });
                        }
                    }
                    
                    this.enemyBullets.push(bullet);
                }
                
                endGame() {
                    this.gameOver = true;
                    this.gameStarted = false;
                    
                    // Restaurar cursor normal
                    this.canvas.classList.remove('game-active');
                    
                    // Efeito de explosão na tela
                    this.createGameOverExplosion();
                    
                    // Animação de tela tremendo
                    this.shakeScreen();
                    
                    // Mostrar tela de game over com animação elaborada
                    this.showGameOverWithAnimation();
                    
                    this.finalScoreElement.textContent = this.score;
                    this.uiOverlay.style.display = 'none';
                    this.instructionsPanel.style.display = 'none';
                    this.instructions.style.display = 'none';
                    // Fechar menu se estiver aberto
                    this.closeEnemiesMenu();
                }
                
                createGameOverExplosion() {
                    // Criar múltiplos efeitos de explosão na posição do jogador
                    for (let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            this.clickEffect.x = this.player.x + (Math.random() - 0.5) * 60;
                            this.clickEffect.y = this.player.y + (Math.random() - 0.5) * 60;
                            this.clickEffect.radius = 0;
                            this.clickEffect.maxRadius = 40 + Math.random() * 30;
                            this.clickEffect.active = true;
                            this.clickEffect.alpha = 1.0;
                        }, i * 40);
                    }
                }
                
                shakeScreen() {
                    // Efeito de tela tremendo
                    const canvas = this.canvas;
                    let shakeIntensity = 15;
                    let shakeDuration = 1000; // 1 segundo
                    const shakeInterval = 16; // ~60fps
                    
                    const originalTransform = canvas.style.transform;
                    const startTime = Date.now();
                    
                    const shake = () => {
                        const elapsed = Date.now() - startTime;
                        if (elapsed < shakeDuration) {
                            const progress = elapsed / shakeDuration;
                            const currentIntensity = shakeIntensity * (1 - progress);
                            
                            const offsetX = (Math.random() - 0.5) * currentIntensity;
                            const offsetY = (Math.random() - 0.5) * currentIntensity;
                            
                            canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                            
                            setTimeout(shake, shakeInterval);
                        } else {
                            canvas.style.transform = originalTransform;
                        }
                    };
                    
                    shake();
                }
                
                showGameOverWithAnimation() {
                    const gameOverScreen = this.gameOverScreen;
                    
                    // Preparar para animação
                    gameOverScreen.style.display = 'block';
                    gameOverScreen.style.opacity = '0';
                    gameOverScreen.style.transform = 'scale(0.3) rotate(-10deg)';
                    gameOverScreen.style.filter = 'blur(10px) brightness(0.3)';
                    gameOverScreen.style.transition = 'none';
                    
                    // Adicionar classe de animação CSS
                    gameOverScreen.classList.add('game-over-animated');
                    
                    // Fase 1: Entrada dramática
                    setTimeout(() => {
                        gameOverScreen.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        gameOverScreen.style.opacity = '1';
                        gameOverScreen.style.transform = 'scale(1.1) rotate(2deg)';
                        gameOverScreen.style.filter = 'blur(0px) brightness(1)';
                    }, 500);
                    
                    // Fase 2: Estabilização com bounce
                    setTimeout(() => {
                        gameOverScreen.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        gameOverScreen.style.transform = 'scale(1) rotate(0deg)';
                    }, 1300);
                    
                    // Fase 3: Efeito pulsante contínuo
                    setTimeout(() => {
                        gameOverScreen.style.transition = 'transform 2s ease-in-out infinite';
                        gameOverScreen.style.transform = 'scale(1.02)';
                    }, 1700);
                    
                    // Animar elementos internos individualmente
                    this.animateGameOverElements();
                }
                
                animateGameOverElements() {
                    const h2 = this.gameOverScreen.querySelector('h2');
                    const paragraphs = this.gameOverScreen.querySelectorAll('p');
                    const button = this.gameOverScreen.querySelector('button');
                    
                    // Animar título com efeito typewriter
                    if (h2) {
                        const originalText = h2.textContent;
                        h2.textContent = '';
                        h2.style.borderRight = '2px solid #ff0000';
                        h2.style.animation = 'blink 1s infinite';
                        
                        let i = 0;
                        const typeWriter = () => {
                            if (i < originalText.length) {
                                h2.textContent += originalText.charAt(i);
                                i++;
                                setTimeout(typeWriter, 150);
                            } else {
                                h2.style.borderRight = 'none';
                                h2.style.animation = 'glow 2s ease-in-out infinite alternate';
                            }
                        };
                        
                        setTimeout(typeWriter, 1000);
                    }
                    
                    // Animar parágrafos com slide-in
                    paragraphs.forEach((p, index) => {
                        p.style.opacity = '0';
                        p.style.transform = 'translateX(-50px)';
                        p.style.transition = 'all 0.6s ease-out';
                        
                        setTimeout(() => {
                            p.style.opacity = '1';
                            p.style.transform = 'translateX(0)';
                        }, 1500 + index * 300);
                    });
                    
                    // Animar botão com bounce
                    if (button) {
                        button.style.opacity = '0';
                        button.style.transform = 'scale(0.5) translateY(20px)';
                        button.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        
                        setTimeout(() => {
                            button.style.opacity = '1';
                            button.style.transform = 'scale(1) translateY(0)';
                            
                            // Adicionar hover effect melhorado
                            button.addEventListener('mouseenter', () => {
                                button.style.transform = 'scale(1.1) translateY(-5px)';
                                button.style.boxShadow = '0 10px 25px rgba(76, 175, 80, 0.4)';
                            });
                            
                            button.addEventListener('mouseleave', () => {
                                button.style.transform = 'scale(1) translateY(0)';
                                button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                            });
                            
                        }, 2500);
                    }
                }
                
                updateClickEffect() {
                    if (this.clickEffect.active) {
                        this.clickEffect.radius += 2;
                        this.clickEffect.alpha -= 0.03;
                        
                        if (this.clickEffect.radius >= this.clickEffect.maxRadius || this.clickEffect.alpha <= 0) {
                            this.clickEffect.active = false;
                        }
                    }
                }
                
                drawPlayer() {
                    // Desenhar rastro
                    this.player.trail.forEach(point => {
                        this.ctx.save();
                        
                        // Detectar se está em modo dark ou light
                        const isDarkMode = document.body.classList.contains('dark-mode');
                        
                        // Transparência mais baixa (mais transparente)
                        this.ctx.globalAlpha = point.alpha * 0.25;
                        this.ctx.beginPath();
                        this.ctx.arc(point.x, point.y, this.player.size * 0.7, 0, Math.PI * 2);
                        
                        // Cor do rastro baseada no modo
                        this.ctx.fillStyle = isDarkMode ? '#1e3a8a' : this.player.color; // Azul escuro no dark mode
                        this.ctx.fill();
                        this.ctx.restore();
                    });
                    
                    // Desenhar player principal usando imagem
                    this.ctx.save();
                    
                    // Sombra
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowOffsetX = 3;
                    this.ctx.shadowOffsetY = 3;
                    
                    // Decidir qual imagem usar baseado no modo
                    const useGrabberImage = this.grabberMode.active && this.grabberImageLoaded;
                    const currentImage = useGrabberImage ? this.grabberImage : this.playerImage;
                    const imageLoaded = useGrabberImage ? this.grabberImageLoaded : this.playerImageLoaded;
                    
                    if (imageLoaded) {
                        // Desenhar imagem do personagem com rotação para apontar na direção do clique
                        this.ctx.translate(this.player.x, this.player.y);
                        
                        // Rotacionar a imagem para que a parte superior aponte na direção do clique
                        // Como a imagem olha para cima por padrão, precisamos ajustar o ângulo
                        // Subtraímos π/2 porque a imagem está orientada para cima (90° no sentido horário)
                        this.ctx.rotate(this.player.angle - Math.PI/2);
                        
                        // Desenhar a imagem centralizada com rotação
                        const imageSize = this.player.size * 2;
                        this.ctx.drawImage(
                            currentImage, 
                            -imageSize / 2, 
                            -imageSize / 2, 
                            imageSize, 
                            imageSize
                        );
                        
                        this.ctx.restore();
                        this.ctx.save();
                        
                        // Resetar transformações para desenhar outros elementos
                        this.ctx.shadowColor = 'transparent';
                    } else {
                        // Fallback: desenhar círculo se a imagem não carregou
                        this.ctx.beginPath();
                        this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
                        this.ctx.fillStyle = this.player.color;
                        this.ctx.fill();
                        
                        // Borda
                        this.ctx.strokeStyle = '#2E7D32';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                        
                        // Olhos (fallback)
                        this.ctx.shadowColor = 'transparent';
                        this.ctx.fillStyle = 'white';
                        this.ctx.beginPath();
                        this.ctx.arc(this.player.x - 6, this.player.y - 5, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.beginPath();
                        this.ctx.arc(this.player.x + 6, this.player.y - 5, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Pupilas (fallback)
                        this.ctx.fillStyle = 'black';
                        this.ctx.beginPath();
                        this.ctx.arc(this.player.x - 6, this.player.y - 5, 1.5, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.beginPath();
                        this.ctx.arc(this.player.x + 6, this.player.y - 5, 1.5, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                    // Barra de vida do jogador
                    const barWidth = this.player.size * 2.5;
                    const barHeight = 6;
                    const barX = this.player.x - barWidth / 2;
                    const barY = this.player.y - this.player.size - 15;
                    
                    // Fundo da barra
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Barra de vida do jogador
                    const healthPercent = this.player.health / this.player.maxHealth;
                    this.ctx.fillStyle = healthPercent > 0.6 ? '#4CAF50' : healthPercent > 0.3 ? '#FFA500' : '#ff4444';
                    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
                    
                    // Borda da barra
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
                    
                    // Barra de stamina do jogador
                    this.drawPlayerStaminaBar();
                    
                    // Círculo de range de tiro
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.beginPath();
                    this.ctx.arc(this.player.x, this.player.y, this.player.shootRange, 0, Math.PI * 2);
                    this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    
                    // Indicador de direção (quando atirando ou movendo) - aponta para onde clicou
                    if (this.player.isShooting || this.player.isMoving) {
                        this.ctx.save();
                        this.ctx.translate(this.player.x, this.player.y);
                        this.ctx.rotate(this.player.angle);
                        
                        // Cor da seta
                        const arrowColor = this.player.isShooting ? '#ff4444' : '#4CAF50';
                        this.ctx.strokeStyle = arrowColor;
                        this.ctx.fillStyle = arrowColor;
                        this.ctx.lineWidth = 3;
                        
                        // Linha da seta apontando na direção exata do clique
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.player.size + 5, 0);
                        this.ctx.lineTo(this.player.size + 20, 0);
                        this.ctx.stroke();
                        
                        // Ponta da seta
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.player.size + 20, 0);
                        this.ctx.lineTo(this.player.size + 15, -3);
                        this.ctx.lineTo(this.player.size + 15, 3);
                        this.ctx.closePath();
                        this.ctx.fill();
                        
                        this.ctx.restore();
                    }
                    
                    // Nickname do jogador
                    if (this.playerNickname) {
                        // Detectar se está em modo dark ou light
                        const isDarkMode = document.body.classList.contains('dark-mode');
                        
                        this.ctx.shadowColor = isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.8)';
                        this.ctx.shadowBlur = 3;
                        this.ctx.shadowOffsetX = 1;
                        this.ctx.shadowOffsetY = 1;
                        
                        // Cor do texto baseada no modo
                        this.ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
                        this.ctx.font = '300 13px Arial'; // Fonte mais fina (300) e menor
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(this.playerNickname, this.player.x, this.player.y - this.player.size - 25);
                        
                        // Borda sutil do texto para melhor legibilidade
                        this.ctx.strokeStyle = isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeText(this.playerNickname, this.player.x, this.player.y - this.player.size - 25);
                    }
                    
                    this.ctx.restore();
                }
                
                drawPlayerStaminaBar() {
                    const barWidth = 50;
                    const barHeight = 6;
                    const barX = this.player.x - barWidth / 2;
                    const barY = this.player.y - this.player.size - 45; // Acima da barra de vida
                    
                    this.ctx.save();
                    
                    // Fundo da barra de stamina
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Barra de stamina - cor baseada no nível
                    const staminaPercent = this.player.stamina / this.player.maxStamina;
                    let staminaColor;
                    
                    if (staminaPercent >= 1.0) {
                        staminaColor = '#00ff00'; // Verde quando cheia
                    } else if (staminaPercent >= 0.5) {
                        staminaColor = '#ffff00'; // Amarelo quando média
                    } else {
                        staminaColor = '#ff4444'; // Vermelho quando baixa
                    }
                    
                    // Efeito de brilho quando pronta para atirar
                    if (this.player.canShoot) {
                        this.ctx.shadowColor = staminaColor;
                        this.ctx.shadowBlur = 8;
                        this.ctx.shadowOffsetX = 0;
                        this.ctx.shadowOffsetY = 0;
                    }
                    
                    this.ctx.fillStyle = staminaColor;
                    this.ctx.fillRect(barX, barY, barWidth * staminaPercent, barHeight);
                    
                    // Borda da barra
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
                    
                    // Indicador visual quando não pode atirar
                    if (!this.player.canShoot && this.player.isShooting) {
                        // Piscar vermelho quando tentando atirar sem stamina
                        const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                        this.ctx.strokeStyle = `rgba(255, 0, 0, ${flash})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
                    }
                    
                    // Texto de status da stamina (pequeno)
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillStyle = 'white';
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 2;
                    
                    if (this.player.canShoot) {
                        this.ctx.strokeText('PRONTO', this.player.x, barY - 3);
                        this.ctx.fillText('PRONTO', this.player.x, barY - 3);
                    } else {
                        const timeLeft = ((this.player.maxStamina - this.player.stamina) / this.player.staminaRegenRate / 60).toFixed(1);
                        this.ctx.strokeText(`${timeLeft}s`, this.player.x, barY - 3);
                        this.ctx.fillText(`${timeLeft}s`, this.player.x, barY - 3);
                    }
                    
                    this.ctx.restore();
                }
                
                drawEnemies() {
                    this.enemies.forEach(enemy => {
                        // Desenhar rastro do inimigo (mais longo para inimigos rápidos)
                        enemy.trail.forEach((point, index) => {
                            this.ctx.save();
                            this.ctx.globalAlpha = point.alpha * 0.3;
                            this.ctx.beginPath();
                            this.ctx.arc(point.x, point.y, enemy.size * (0.4 + index * 0.1), 0, Math.PI * 2);
                            this.ctx.fillStyle = enemy.color;
                            this.ctx.fill();
                            this.ctx.restore();
                        });
                        
                        // Efeitos especiais por tipo
                        this.drawEnemySpecialEffects(enemy);
                        
                        // Desenhar inimigo principal
                        this.ctx.save();
                        
                        // Sombra do inimigo
                        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                        this.ctx.shadowBlur = 8;
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;
                        
                        // Verificar se a imagem do inimigo está carregada
                        const enemyImage = this.enemyImages[enemy.type];
                        const imageLoaded = this.enemyImagesLoaded[enemy.type];
                        
                        if (enemyImage && imageLoaded) {
                            // Desenhar imagem do inimigo com rotação para apontar para o jogador
                            this.ctx.translate(enemy.x, enemy.y);
                            
                            // Rotacionar para que a parte superior da imagem aponte para o jogador
                            // Assumindo que as imagens dos inimigos também olham para cima por padrão
                            this.ctx.rotate(enemy.angle - Math.PI/2);
                            
                            // Desenhar a imagem centralizada
                            const imageSize = enemy.size * 2;
                            this.ctx.drawImage(
                                enemyImage,
                                -imageSize / 2,
                                -imageSize / 2,
                                imageSize,
                                imageSize
                            );
                            
                            this.ctx.restore();
                            this.ctx.save();
                            
                            // Resetar transformações para desenhar outros elementos
                            this.ctx.shadowColor = 'transparent';
                        } else {
                            // Fallback: desenhar círculo se a imagem não carregou
                            // Cor baseada no tipo e estado
                            this.setEnemyColor(enemy);
                            
                            // Corpo do inimigo com tamanho baseado no tipo
                            this.ctx.beginPath();
                            const renderSize = this.getEnemyRenderSize(enemy);
                            this.ctx.arc(enemy.x, enemy.y, renderSize, 0, Math.PI * 2);
                            this.ctx.fillStyle = enemy.color;
                            this.ctx.fill();
                            
                            // Borda com cor especial por tipo
                            this.ctx.strokeStyle = this.getEnemyBorderColor(enemy);
                            this.ctx.lineWidth = enemy.type === 'tank' ? 3 : 2;
                            this.ctx.stroke();
                            
                            // Desenhar elementos específicos do tipo
                            this.drawEnemyTypeElements(enemy);
                            
                            // Resetar sombra
                            this.ctx.shadowColor = 'transparent';
                        }
                        
                        // Barra de vida melhorada
                        this.drawEnemyHealthBar(enemy);
                        
                        // Indicador de range de tiro do inimigo
                        this.drawEnemyRangeIndicator(enemy);
                        
                        // Efeito visual de click - contorno vermelho piscante
                        if (enemy.clickEffect && enemy.clickEffect.timer > 0) {
                            this.ctx.save();
                            
                            // Calcular intensidade do flash baseado no tempo restante
                            const flashIntensity = Math.sin((enemy.clickEffect.timer / enemy.clickEffect.duration) * Math.PI * 8) * 0.5 + 0.5;
                            const alpha = flashIntensity * (enemy.clickEffect.timer / enemy.clickEffect.duration);
                            
                            this.ctx.globalAlpha = alpha;
                            this.ctx.strokeStyle = '#ff0000'; // Vermelho
                            this.ctx.lineWidth = 1; // Linha bem fina
                            this.ctx.shadowColor = '#ff0000';
                            this.ctx.shadowBlur = 3; // Sombra muito sutil
                            
                            // Verificar se a imagem está carregada para fazer contorno preciso
                            const clickEnemyImage = this.enemyImages[enemy.type];
                            const clickImageLoaded = this.enemyImagesLoaded[enemy.type];
                            
                            if (clickEnemyImage && clickImageLoaded) {
                                // Contorno seguindo o formato da imagem - apenas 1 contorno fino
                                const imageSize = enemy.size * 2;
                                const halfSize = imageSize / 2;
                                const margin = 5; // Margem pequena
                                
                                // Desenhar apenas um contorno fino
                                this.ctx.strokeRect(
                                    enemy.x - halfSize - margin,
                                    enemy.y - halfSize - margin,
                                    imageSize + (margin * 2),
                                    imageSize + (margin * 2)
                                );
                                
                                // Contorno circular sutil
                                this.ctx.globalAlpha = alpha * 0.3;
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, halfSize + 6, 0, Math.PI * 2);
                                this.ctx.stroke();
                            } else {
                                // Fallback: contorno circular fino se a imagem não carregou
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + 6, 0, Math.PI * 2);
                                this.ctx.stroke();
                            }
                            
                            this.ctx.restore();
                        }
                        
                        // Hitbox do inimigo (área clicável) - quase transparente
                        this.ctx.save();
                        this.ctx.globalAlpha = 0.1;
                        this.ctx.shadowColor = 'transparent';
                        this.ctx.fillStyle = '#ffff00';
                        this.ctx.beginPath();
                        this.ctx.arc(enemy.x, enemy.y, enemy.size + 10, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Borda do hitbox ainda mais sutil
                        this.ctx.globalAlpha = 0.2;
                        this.ctx.strokeStyle = '#ffff00';
                        this.ctx.lineWidth = 1;
                        this.ctx.setLineDash([2, 4]);
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                        this.ctx.restore();
                        
                        this.ctx.restore();
                    });
                }
                
                drawEnemySpecialEffects(enemy) {
                    switch (enemy.type) {
                        case 'tank':
                            // Feedback visual melhorado para o tank
                            if (!enemy.isCharging) {
                                // Tank está em pausa (tempo de espera)
                                const pausePercent = enemy.pauseDuration / enemy.maxPauseDuration;
                                
                                // Círculo de pausa pulsante
                                this.ctx.save();
                                const pulseIntensity = 0.4 + Math.sin(Date.now() * 0.008) * 0.3;
                                this.ctx.globalAlpha = pulseIntensity;
                                this.ctx.strokeStyle = '#ff8800'; // Laranja para indicar pausa
                                this.ctx.lineWidth = 4;
                                this.ctx.setLineDash([8, 8]);
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + 15, 0, Math.PI * 2);
                                this.ctx.stroke();
                                this.ctx.setLineDash([]);
                                this.ctx.restore();
                                
                                // Barra de progresso circular para mostrar quanto tempo falta
                                this.ctx.save();
                                this.ctx.strokeStyle = '#ffaa00';
                                this.ctx.lineWidth = 6;
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + 20, 
                                    -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * pausePercent));
                                this.ctx.stroke();
                                this.ctx.restore();
                                
                                // Ícone de pausa no centro
                                this.ctx.save();
                                this.ctx.fillStyle = `rgba(255, 170, 0, ${0.8 + Math.sin(Date.now() * 0.01) * 0.2})`;
                                // Duas barras verticais para simbolizar pausa
                                this.ctx.fillRect(enemy.x - 4, enemy.y - 6, 2, 12);
                                this.ctx.fillRect(enemy.x + 2, enemy.y - 6, 2, 12);
                                this.ctx.restore();
                                
                                // Efeito de "cooldown" - anéis que se expandem
                                const ringCount = 3;
                                for (let i = 0; i < ringCount; i++) {
                                    const ringProgress = (pausePercent + i * 0.33) % 1;
                                    this.ctx.save();
                                    this.ctx.globalAlpha = (1 - ringProgress) * 0.4;
                                    this.ctx.strokeStyle = '#ffcc44';
                                    this.ctx.lineWidth = 2;
                                    this.ctx.beginPath();
                                    this.ctx.arc(enemy.x, enemy.y, 
                                        enemy.size + 10 + ringProgress * 25, 0, Math.PI * 2);
                                    this.ctx.stroke();
                                    this.ctx.restore();
                                }
                                
                            } else {
                                // Tank está carregando (correndo)
                                this.ctx.save();
                                this.ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.02) * 0.4;
                                this.ctx.strokeStyle = '#ff0000';
                                this.ctx.lineWidth = 5;
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + 12, 0, Math.PI * 2);
                                this.ctx.stroke();
                                
                                // Efeito de velocidade - raios saindo do tank
                                this.ctx.strokeStyle = '#ff4444';
                                this.ctx.lineWidth = 3;
                                for (let i = 0; i < 8; i++) {
                                    const angle = (Date.now() * 0.01 + i * Math.PI / 4);
                                    this.ctx.beginPath();
                                    this.ctx.moveTo(enemy.x + Math.cos(angle) * (enemy.size + 8), 
                                                enemy.y + Math.sin(angle) * (enemy.size + 8));
                                    this.ctx.lineTo(enemy.x + Math.cos(angle) * (enemy.size + 18), 
                                                enemy.y + Math.sin(angle) * (enemy.size + 18));
                                    this.ctx.stroke();
                                }
                                this.ctx.restore();
                            }
                            break;
                            
                        case 'sniper':
                            // Linha de mira quando carregando
                            if (enemy.isCharging) {
                                const chargePercent = 1 - (enemy.chargeTime / 60);
                                this.ctx.save();
                                this.ctx.strokeStyle = `rgba(255, 0, 0, ${chargePercent * 0.8})`;
                                this.ctx.lineWidth = 2;
                                this.ctx.setLineDash([5, 5]);
                                this.ctx.beginPath();
                                this.ctx.moveTo(enemy.x, enemy.y);
                                this.ctx.lineTo(this.player.x, this.player.y);
                                this.ctx.stroke();
                                this.ctx.setLineDash([]);
                                this.ctx.restore();
                                
                                // Indicador de carregamento
                                this.ctx.save();
                                this.ctx.strokeStyle = '#ff0000';
                                this.ctx.lineWidth = 3;
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + 8, 
                                    -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * chargePercent));
                                this.ctx.stroke();
                                this.ctx.restore();
                            }
                            break;
                            
                        case 'berserker':
                            // Aura vermelha quando enraivecido
                            if (enemy.isRaging) {
                                this.ctx.save();
                                this.ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
                                this.ctx.strokeStyle = '#ff0000';
                                this.ctx.lineWidth = 4;
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + 10, 0, Math.PI * 2);
                                this.ctx.stroke();
                                this.ctx.restore();
                            }
                            break;
                            
                        case 'fast':
                            // Efeito de velocidade
                            this.ctx.save();
                            this.ctx.globalAlpha = 0.4;
                            for (let i = 0; i < 3; i++) {
                                this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 - i * 0.2})`;
                                this.ctx.lineWidth = 2;
                                this.ctx.beginPath();
                                this.ctx.arc(enemy.x, enemy.y, enemy.size + i * 5, 0, Math.PI * 2);
                                this.ctx.stroke();
                            }
                            this.ctx.restore();
                            break;
                            
                        case 'elite':
                            // Efeito de energia
                            this.ctx.save();
                            this.ctx.globalAlpha = 0.6;
                            this.ctx.strokeStyle = '#9966ff';
                            this.ctx.lineWidth = 2;
                            const pulseSize = Math.sin(Date.now() * 0.005) * 8;
                            this.ctx.beginPath();
                            this.ctx.arc(enemy.x, enemy.y, enemy.size + 5 + pulseSize, 0, Math.PI * 2);
                            this.ctx.stroke();
                            this.ctx.restore();
                            break;
                    }
                }
                
                setEnemyColor(enemy) {
                    let healthPercent = enemy.health / enemy.maxHealth;
                    
                    switch (enemy.type) {
                        case 'fast':
                            enemy.color = `rgb(0, ${Math.floor(200 + 55 * healthPercent)}, 255)`;
                            break;
                        case 'tank':
                            if (!enemy.isCharging) {
                                // Durante a pausa - cor laranja/amarela pulsante
                                const pulseIntensity = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
                                const baseColor = Math.floor(150 * pulseIntensity);
                                const orangeComponent = Math.floor(200 * pulseIntensity);
                                enemy.color = `rgb(${orangeComponent}, ${Math.floor(baseColor + 50 * healthPercent)}, ${Math.floor(baseColor * 0.3)})`;
                            } else {
                                // Durante a carga - cor vermelha intensa
                                enemy.color = `rgb(${Math.floor(200 + 55 * healthPercent)}, ${Math.floor(50 * healthPercent)}, ${Math.floor(50 * healthPercent)})`;
                            }
                            break;
                        case 'sniper':
                            enemy.color = `rgb(${Math.floor(150 + 105 * healthPercent)}, ${Math.floor(0 + 100 * healthPercent)}, 0)`;
                            break;
                        case 'berserker':
                            if (enemy.isRaging) {
                                enemy.color = '#ff0022';
                            } else {
                                enemy.color = `rgb(${Math.floor(200 + 55 * healthPercent)}, ${Math.floor(50 * healthPercent)}, 0)`;
                            }
                            break;
                        case 'elite':
                            enemy.color = `rgb(${Math.floor(150 + 50 * healthPercent)}, ${Math.floor(100 * healthPercent)}, ${Math.floor(200 + 55 * healthPercent)})`;
                            break;
                        default:
                            // Basic enemy
                            let red = Math.floor(255 * (1 - healthPercent * 0.3));
                            let green = Math.floor(68 * healthPercent);
                            enemy.color = `rgb(${red}, ${green}, 68)`;
                            break;
                    }
                }
                
                getEnemyRenderSize(enemy) {
                    let baseSize = enemy.size;
                    
                    switch (enemy.type) {
                        case 'tank':
                            return baseSize * 1.2; // Tanks são maiores
                        case 'fast':
                            return baseSize * 0.8; // Fast enemies são menores
                        case 'berserker':
                            return enemy.isRaging ? baseSize * 1.1 : baseSize;
                        default:
                            return baseSize;
                    }
                }
                
                getEnemyBorderColor(enemy) {
                    switch (enemy.type) {
                        case 'fast': return '#00ffff';
                        case 'tank': return '#888888';
                        case 'sniper': return '#ff8800';
                        case 'berserker': return enemy.isRaging ? '#ff0000' : '#ff4400';
                        case 'mage': return '#4488ff';
                        case 'elite': return '#9966ff';
                        default: return '#cc0000';
                    }
                }
                
                drawEnemyTypeElements(enemy) {
                    switch (enemy.type) {
                        case 'sniper':
                            // Símbolo de mira
                            this.ctx.save();
                            this.ctx.strokeStyle = '#ff8800';
                            this.ctx.lineWidth = 2;
                            this.ctx.beginPath();
                            this.ctx.moveTo(enemy.x - 6, enemy.y);
                            this.ctx.lineTo(enemy.x + 6, enemy.y);
                            this.ctx.moveTo(enemy.x, enemy.y - 6);
                            this.ctx.lineTo(enemy.x, enemy.y + 6);
                            this.ctx.stroke();
                            this.ctx.restore();
                            break;
                            
                        case 'tank':
                            // Armadura
                            this.ctx.save();
                            this.ctx.fillStyle = '#666666';
                            this.ctx.beginPath();
                            this.ctx.rect(enemy.x - 8, enemy.y + 5, 16, 4);
                            this.ctx.fill();
                            this.ctx.restore();
                            break;
                            
                        case 'fast':
                            // Raios de velocidade
                            this.ctx.save();
                            this.ctx.strokeStyle = '#00ffff';
                            this.ctx.lineWidth = 1;
                            for (let i = 0; i < 4; i++) {
                                const angle = (Date.now() * 0.01 + i * Math.PI / 2);
                                this.ctx.beginPath();
                                this.ctx.moveTo(enemy.x + Math.cos(angle) * 5, enemy.y + Math.sin(angle) * 5);
                                this.ctx.lineTo(enemy.x + Math.cos(angle) * 10, enemy.y + Math.sin(angle) * 10);
                                this.ctx.stroke();
                            }
                            this.ctx.restore();
                            break;
                            
                        case 'mage':
                            // Estrelas mágicas
                            this.ctx.save();
                            this.ctx.fillStyle = '#66aaff';
                            this.ctx.strokeStyle = '#4488ff';
                            this.ctx.lineWidth = 1;
                            for (let i = 0; i < 3; i++) {
                                const angle = (Date.now() * 0.015 + i * Math.PI * 2 / 3);
                                const x = enemy.x + Math.cos(angle) * 12;
                                const y = enemy.y + Math.sin(angle) * 12;
                                
                                this.ctx.beginPath();
                                this.ctx.moveTo(x, y - 3);
                                this.ctx.lineTo(x - 2, y + 1);
                                this.ctx.lineTo(x + 2, y + 1);
                                this.ctx.closePath();
                                this.ctx.fill();
                                this.ctx.stroke();
                            }
                            this.ctx.restore();
                            break;
                            
                        case 'elite':
                            // Cristal de energia
                            this.ctx.save();
                            this.ctx.fillStyle = '#9966ff';
                            this.ctx.beginPath();
                            this.ctx.moveTo(enemy.x, enemy.y - 8);
                            this.ctx.lineTo(enemy.x - 4, enemy.y - 2);
                            this.ctx.lineTo(enemy.x, enemy.y + 2);
                            this.ctx.lineTo(enemy.x + 4, enemy.y - 2);
                            this.ctx.closePath();
                            this.ctx.fill();
                            this.ctx.restore();
                            break;
                    }
                    
                    // Olhos adaptados ao tipo
                    this.drawEnemyEyes(enemy);
                }
                
                drawEnemyEyes(enemy) {
                    let eyeColor = '#ffaaaa';
                    let pupilColor = '#660000';
                    
                    switch (enemy.type) {
                        case 'fast':
                            eyeColor = '#aaffff';
                            pupilColor = '#006666';
                            break;
                        case 'tank':
                            eyeColor = '#ffaaaa';
                            pupilColor = '#660000';
                            break;
                        case 'sniper':
                            eyeColor = '#ffcc66';
                            pupilColor = '#cc6600';
                            break;
                        case 'berserker':
                            eyeColor = enemy.isRaging ? '#ff6666' : '#ffaaaa';
                            pupilColor = enemy.isRaging ? '#990000' : '#660000';
                            break;
                        case 'elite':
                            eyeColor = '#ccaaff';
                            pupilColor = '#6600cc';
                            break;
                    }
                    
                    // Olhos
                    this.ctx.fillStyle = eyeColor;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x - 4, enemy.y - 3, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x + 4, enemy.y - 3, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Pupilas
                    this.ctx.fillStyle = pupilColor;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x - 4, enemy.y - 3, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x + 4, enemy.y - 3, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                drawEnemyHealthBar(enemy) {
                    const barWidth = enemy.size * 2.5;
                    const barHeight = 4;
                    const barX = enemy.x - barWidth / 2;
                    const barY = enemy.y - enemy.size - 15;
                    const healthPercent = enemy.health / enemy.maxHealth;
                    
                    // Fundo da barra
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    this.ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Barra de vida com cores mais vibrantes
                    let healthColor = '#00FF00'; // Verde mais vibrante
                    if (healthPercent <= 0.3) {
                        healthColor = '#FF0000'; // Vermelho puro
                    } else if (healthPercent <= 0.6) {
                        healthColor = '#FF8C00'; // Laranja intenso
                    }
                    
                    // Cor especial para tipos específicos mais visíveis
                    switch (enemy.type) {
                        case 'tank':
                            healthColor = healthPercent > 0.6 ? '#C0C0C0' : healthColor; // Prata mais claro
                            break;
                        case 'elite':
                            healthColor = healthPercent > 0.6 ? '#8A2BE2' : healthColor; // Roxo mais vibrante
                            break;
                    }
                    
                    this.ctx.fillStyle = healthColor;
                    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
                    
                    // Indicador de tipo na barra de vida
                    if (enemy.type !== 'basic') {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        this.ctx.font = '8px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(enemy.type.toUpperCase(), enemy.x, barY - 2);
                    }
                }
                
                drawEnemyRangeIndicator(enemy) {
                    const distanceToPlayer = Math.sqrt(
                        (this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2
                    );
                    
                    if (distanceToPlayer <= enemy.shootRange) {
                        this.ctx.save();
                        this.ctx.strokeStyle = `rgba(255, 100, 100, 0.3)`;
                        this.ctx.lineWidth = 1;
                        this.ctx.setLineDash([3, 3]);
                        this.ctx.beginPath();
                        this.ctx.arc(enemy.x, enemy.y, enemy.shootRange, 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                        this.ctx.restore();
                    }
                }
                
                drawEnemyBullets() {
                    this.enemyBullets.forEach(bullet => {
                        if (bullet.active) {
                            this.ctx.save();
                            
                            // Renderização especial para balas do sniper
                            if (bullet.type === 'sniper') {
                                // === RASTRO LONGO DA BALA DO SNIPER ===
                                this.ctx.globalCompositeOperation = 'screen';
                                
                                // Desenhar rastro longo
                                if (bullet.trail && bullet.trail.length > 1) {
                                    this.ctx.beginPath();
                                    this.ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
                                    
                                    for (let i = 1; i < bullet.trail.length; i++) {
                                        this.ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
                                    }
                                    
                                    // Rastro dourado brilhante
                                    this.ctx.strokeStyle = `rgba(255, 170, 0, ${bullet.energy * 0.8})`;
                                    this.ctx.lineWidth = bullet.size * 2;
                                    this.ctx.stroke();
                                    
                                    // Rastro interno mais brilhante
                                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${bullet.energy * 0.6})`;
                                    this.ctx.lineWidth = bullet.size;
                                    this.ctx.stroke();
                                }
                                
                                // === PARTÍCULAS DA BALA DO SNIPER ===
                                this.ctx.globalCompositeOperation = 'lighter';
                                if (bullet.particles) {
                                    bullet.particles.forEach(particle => {
                                        if (particle.life > 0) {
                                            this.ctx.beginPath();
                                            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                                            this.ctx.fillStyle = `rgba(255, 200, 50, ${particle.life})`;
                                            this.ctx.fill();
                                        }
                                    });
                                }
                                
                                // === NÚCLEO DOURADO DA BALA ===
                                this.ctx.shadowColor = '#ffaa00';
                                this.ctx.shadowBlur = 20;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size + 2, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 170, 0, 0.8)';
                                this.ctx.fill();
                                
                                // Centro super brilhante
                                this.ctx.shadowBlur = 15;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                                this.ctx.fillStyle = '#ffffff';
                                this.ctx.fill();
                                
                            } else {
                                // === RENDERIZAÇÃO PADRÃO PARA OUTRAS BALAS ===
                                this.ctx.globalCompositeOperation = 'screen';
                                
                                // Camada ultra-externa - halo de luz muito grande
                                this.ctx.shadowColor = '#ff0000';
                                this.ctx.shadowBlur = 35;
                                this.ctx.shadowOffsetX = 0;
                                this.ctx.shadowOffsetY = 0;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size + 6, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                                this.ctx.fill();
                                
                                // Camada externa - brilho expandido
                                this.ctx.shadowBlur = 30;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size + 4, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                                this.ctx.fill();
                                
                                // Camada média-externa - intensidade crescente
                                this.ctx.shadowBlur = 25;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size + 2, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 20, 20, 0.6)';
                                this.ctx.fill();
                                
                                // Camada média - brilho intenso
                                this.ctx.shadowBlur = 20;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size + 1, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
                                this.ctx.fill();
                                
                                // Núcleo da bala - ultra brilhante
                                this.ctx.globalCompositeOperation = 'lighter';
                                this.ctx.shadowBlur = 15;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                                this.ctx.fillStyle = '#ffffff';
                                this.ctx.fill();
                                
                                // Centro super-brilhante
                                this.ctx.shadowBlur = 10;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x, bullet.y, bullet.size * 0.6, 0, Math.PI * 2);
                                this.ctx.fillStyle = '#ffff88';
                                this.ctx.fill();
                                
                                // Rastro da bala inimiga com brilho intenso
                                this.ctx.globalCompositeOperation = 'screen';
                                this.ctx.shadowColor = '#ff0000';
                                this.ctx.shadowBlur = 15;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x - bullet.velocityX * 2, bullet.y - bullet.velocityY * 2, bullet.size * 0.6, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
                                this.ctx.fill();
                                
                                // Rastro secundário
                                this.ctx.shadowBlur = 10;
                                this.ctx.beginPath();
                                this.ctx.arc(bullet.x - bullet.velocityX * 1, bullet.y - bullet.velocityY * 1, bullet.size * 0.4, 0, Math.PI * 2);
                                this.ctx.fillStyle = 'rgba(255, 120, 120, 0.7)';
                                this.ctx.fill();
                            }
                            
                            this.ctx.restore();
                        }
                    });
                }
                
                drawBullets() {
                    this.bullets.forEach(bullet => {
                        if (bullet.active) {
                            this.ctx.save();
                            
                            // === FEIXE DE LUZ PRINCIPAL ===
                            // Criar gradiente mais vibrante para o feixe
                            const length = Math.sqrt(bullet.velocityX ** 2 + bullet.velocityY ** 2) * 3;
                            const gradient = this.ctx.createLinearGradient(
                                bullet.x - bullet.velocityX * 2, 
                                bullet.y - bullet.velocityY * 2,
                                bullet.x + bullet.velocityX * 2, 
                                bullet.y + bullet.velocityY * 2
                            );
                            
                            gradient.addColorStop(0, 'rgba(255, 69, 0, 0)');
                            gradient.addColorStop(0.3, `rgba(255, 140, 0, ${bullet.energy * 0.9})`);
                            gradient.addColorStop(0.7, `rgba(255, 255, 255, ${bullet.energy})`);
                            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
                            
                            // Desenhar o feixe principal
                            this.ctx.globalCompositeOperation = 'screen';
                            this.ctx.beginPath();
                            this.ctx.arc(bullet.x, bullet.y, bullet.size * bullet.energy, 0, Math.PI * 2);
                            this.ctx.fillStyle = gradient;
                            this.ctx.fill();
                            
                            // === NÚCLEO BRILHANTE ===
                            this.ctx.globalCompositeOperation = 'lighter';
                            this.ctx.shadowColor = '#FF8C00';
                            this.ctx.shadowBlur = 18 * bullet.energy;
                            
                            this.ctx.beginPath();
                            this.ctx.arc(bullet.x, bullet.y, bullet.size * 0.6 * bullet.energy, 0, Math.PI * 2);
                            this.ctx.fillStyle = `rgba(255, 255, 255, ${bullet.energy})`;
                            this.ctx.fill();
                            
                            // === RASTRO LUMINOSO ===
                            this.ctx.globalCompositeOperation = 'screen';
                            this.ctx.shadowColor = 'transparent';
                            
                            if (bullet.trail.length > 1) {
                                this.ctx.beginPath();
                                this.ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
                                
                                for (let i = 1; i < bullet.trail.length; i++) {
                                    const point = bullet.trail[i];
                                    const alpha = point.alpha * bullet.energy * 0.6;
                                    
                                    this.ctx.lineTo(point.x, point.y);
                                }
                                
                                this.ctx.strokeStyle = `rgba(255, 140, 0, ${bullet.energy * 0.8})`;
                                this.ctx.lineWidth = bullet.size * bullet.energy;
                                this.ctx.stroke();
                                
                                // Rastro interno mais brilhante
                                this.ctx.strokeStyle = `rgba(255, 255, 255, ${bullet.energy * 0.6})`;
                                this.ctx.lineWidth = bullet.size * 0.4 * bullet.energy;
                                this.ctx.stroke();
                            }
                            
                            // === PARTÍCULAS DE ENERGIA ===
                            this.ctx.globalCompositeOperation = 'lighter';
                            bullet.particles.forEach(particle => {
                                if (particle.life > 0) {
                                    this.ctx.save();
                                    this.ctx.globalAlpha = particle.life * bullet.energy;
                                    this.ctx.shadowColor = '#FFD700';
                                    this.ctx.shadowBlur = 8;
                                    
                                    this.ctx.beginPath();
                                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                                    this.ctx.fillStyle = '#FFFFFF';
                                    this.ctx.fill();
                                    this.ctx.restore();
                                }
                            });
                            
                            // === ANEL DE ENERGIA PULSANTE ===
                            const time = Date.now() * 0.01;
                            const pulse = 1 + Math.sin(time + bullet.x * 0.1) * 0.3;
                            
                            this.ctx.globalCompositeOperation = 'screen';
                            this.ctx.beginPath();
                            this.ctx.arc(bullet.x, bullet.y, bullet.size * pulse * bullet.energy, 0, Math.PI * 2);
                            this.ctx.strokeStyle = `rgba(255, 215, 0, ${bullet.energy * 0.3})`;
                            this.ctx.lineWidth = 2;
                            this.ctx.stroke();
                            
                            // === EFEITO DE DISTORÇÃO ===
                            this.ctx.globalCompositeOperation = 'overlay';
                            const distortRadius = bullet.size * 2 * bullet.energy;
                            const distortGradient = this.ctx.createRadialGradient(
                                bullet.x, bullet.y, 0,
                                bullet.x, bullet.y, distortRadius
                            );
                            distortGradient.addColorStop(0, `rgba(255, 255, 255, ${bullet.energy * 0.1})`);
                            distortGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                            
                            this.ctx.beginPath();
                            this.ctx.arc(bullet.x, bullet.y, distortRadius, 0, Math.PI * 2);
                            this.ctx.fillStyle = distortGradient;
                            this.ctx.fill();
                            
                            this.ctx.restore();
                        }
                    });
                }
                
                drawClickEffect() {
                    if (this.clickEffect.active) {
                        this.ctx.save();
                        this.ctx.globalAlpha = this.clickEffect.alpha;
                        
                        // Círculo externo
                        this.ctx.beginPath();
                        this.ctx.arc(this.clickEffect.x, this.clickEffect.y, this.clickEffect.radius, 0, Math.PI * 2);
                        this.ctx.strokeStyle = '#FFD700';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                        
                        // Círculo interno
                        this.ctx.beginPath();
                        this.ctx.arc(this.clickEffect.x, this.clickEffect.y, this.clickEffect.radius * 0.5, 0, Math.PI * 2);
                        this.ctx.strokeStyle = '#FFA500';
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();
                        
                        this.ctx.restore();
                    }
                }
                
                drawTargetIndicator() {
                    if (this.player.isMoving) {
                        this.ctx.save();
                        this.ctx.setLineDash([5, 5]);
                        
                        // Linha de movimento mais visível
                        this.ctx.shadowColor = '#00CED1';
                        this.ctx.shadowBlur = 8;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.player.x, this.player.y);
                        this.ctx.lineTo(this.player.targetX, this.player.targetY);
                        this.ctx.strokeStyle = 'rgba(0, 206, 209, 0.8)';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                        
                        // X no destino mais vibrante
                        this.ctx.setLineDash([]);
                        this.ctx.shadowColor = '#FF1493';
                        this.ctx.shadowBlur = 10;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.player.targetX - 10, this.player.targetY - 10);
                        this.ctx.lineTo(this.player.targetX + 10, this.player.targetY + 10);
                        this.ctx.moveTo(this.player.targetX + 10, this.player.targetY - 10);
                        this.ctx.lineTo(this.player.targetX - 10, this.player.targetY + 10);
                        this.ctx.strokeStyle = '#FF1493';
                        this.ctx.lineWidth = 4;
                        this.ctx.stroke();
                        
                        this.ctx.restore();
                    }
                }
                
                drawCustomCursor() {
                    // Só desenhar cursor customizado se o jogo estiver ativo
                    if (!this.cursor.visible || !this.gameStarted || this.gameOver) return;
                    
                    this.ctx.save();
                    
                    const time = Date.now() * 0.005;
                    const pulseSize = 2 + Math.sin(time * 2) * 1;
                    
                    if (this.cursor.targetEnemy) {
                        // Cursor sobre inimigo
                        if (this.cursor.inRange) {
                            // Inimigo no range - cursor de ataque (cores mais vibrantes)
                            this.ctx.shadowColor = '#FF8C00';
                            this.ctx.shadowBlur = 15;
                            
                            // Círculo externo dourado intenso
                            this.ctx.beginPath();
                            this.ctx.arc(this.cursor.x, this.cursor.y, 15 + pulseSize, 0, Math.PI * 2);
                            this.ctx.strokeStyle = '#FF8C00';
                            this.ctx.lineWidth = 4;
                            this.ctx.stroke();
                            
                            // Círculo interno laranja vibrante
                            this.ctx.beginPath();
                            this.ctx.arc(this.cursor.x, this.cursor.y, 8, 0, Math.PI * 2);
                            this.ctx.strokeStyle = '#FF4500';
                            this.ctx.lineWidth = 3;
                            this.ctx.stroke();
                            
                            // Cruz de mira com contraste alto
                            this.ctx.shadowBlur = 8;
                            this.ctx.beginPath();
                            this.ctx.moveTo(this.cursor.x - 12, this.cursor.y);
                            this.ctx.lineTo(this.cursor.x + 12, this.cursor.y);
                            this.ctx.moveTo(this.cursor.x, this.cursor.y - 12);
                            this.ctx.lineTo(this.cursor.x, this.cursor.y + 12);
                            this.ctx.strokeStyle = '#FF8C00';
                            this.ctx.lineWidth = 3;
                            this.ctx.stroke();
                            
                            // Ponto central mais visível
                            this.ctx.shadowColor = '#FFFFFF';
                            this.ctx.shadowBlur = 12;
                            this.ctx.beginPath();
                            this.ctx.arc(this.cursor.x, this.cursor.y, 3, 0, Math.PI * 2);
                            this.ctx.fillStyle = '#FFFFFF';
                            this.ctx.fill();
                            
                        } else {
                            // Inimigo fora do range - cursor vermelho mais intenso
                            this.ctx.shadowColor = '#DC143C';
                            this.ctx.shadowBlur = 12;
                            
                            // Círculo vermelho intenso
                            this.ctx.beginPath();
                            this.ctx.arc(this.cursor.x, this.cursor.y, 12 + pulseSize, 0, Math.PI * 2);
                            this.ctx.strokeStyle = '#DC143C';
                            this.ctx.lineWidth = 4;
                            this.ctx.stroke();
                            
                            // X mais visível
                            this.ctx.shadowBlur = 8;
                            this.ctx.beginPath();
                            this.ctx.moveTo(this.cursor.x - 8, this.cursor.y - 8);
                            this.ctx.lineTo(this.cursor.x + 8, this.cursor.y + 8);
                            this.ctx.moveTo(this.cursor.x + 8, this.cursor.y - 8);
                            this.ctx.lineTo(this.cursor.x - 8, this.cursor.y + 8);
                            this.ctx.strokeStyle = '#DC143C';
                            this.ctx.lineWidth = 4;
                            this.ctx.stroke();
                        }
                        
                    } else {
                        // Cursor de movimento padrão - verde mais intenso
                        this.ctx.shadowColor = '#228B22';
                        this.ctx.shadowBlur = 10;
                        
                        // Círculo externo verde vibrante
                        this.ctx.beginPath();
                        this.ctx.arc(this.cursor.x, this.cursor.y, 10 + pulseSize * 0.5, 0, Math.PI * 2);
                        this.ctx.strokeStyle = '#228B22';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                        
                        // Círculo interno verde escuro
                        this.ctx.beginPath();
                        this.ctx.arc(this.cursor.x, this.cursor.y, 6, 0, Math.PI * 2);
                        this.ctx.strokeStyle = '#006400';
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();
                        
                        // Setas direcionais mais visíveis
                        this.ctx.shadowBlur = 6;
                        const arrowSize = 6;
                        const arrowDistance = 14;
                        
                        // Seta para cima
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.cursor.x, this.cursor.y - arrowDistance);
                        this.ctx.lineTo(this.cursor.x - arrowSize/2, this.cursor.y - arrowDistance + arrowSize);
                        this.ctx.lineTo(this.cursor.x + arrowSize/2, this.cursor.y - arrowDistance + arrowSize);
                        this.ctx.closePath();
                        this.ctx.fillStyle = '#228B22';
                        this.ctx.fill();
                        
                        // Seta para direita
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.cursor.x + arrowDistance, this.cursor.y);
                        this.ctx.lineTo(this.cursor.x + arrowDistance - arrowSize, this.cursor.y - arrowSize/2);
                        this.ctx.lineTo(this.cursor.x + arrowDistance - arrowSize, this.cursor.y + arrowSize/2);
                        this.ctx.closePath();
                        this.ctx.fill();
                        
                        // Seta para baixo
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.cursor.x, this.cursor.y + arrowDistance);
                        this.ctx.lineTo(this.cursor.x - arrowSize/2, this.cursor.y + arrowDistance - arrowSize);
                        this.ctx.lineTo(this.cursor.x + arrowSize/2, this.cursor.y + arrowDistance - arrowSize);
                        this.ctx.closePath();
                        this.ctx.fill();
                        
                        // Seta para esquerda
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.cursor.x - arrowDistance, this.cursor.y);
                        this.ctx.lineTo(this.cursor.x - arrowDistance + arrowSize, this.cursor.y - arrowSize/2);
                        this.ctx.lineTo(this.cursor.x - arrowDistance + arrowSize, this.cursor.y + arrowSize/2);
                        this.ctx.closePath();
                        this.ctx.fill();
                        
                        // Ponto central
                        this.ctx.shadowBlur = 4;
                        this.ctx.beginPath();
                        this.ctx.arc(this.cursor.x, this.cursor.y, 2, 0, Math.PI * 2);
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.fill();
                    }
                    
                    this.ctx.restore();
                }
                
                render() {
                    // Limpar canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    if (this.gameStarted && !this.gameOver) {
                        this.drawTargetIndicator();
                        this.drawClickEffect();
                        this.drawSpecialAbilityCastEffects(); // Efeitos de lançamento
                        this.drawEnemies();
                        this.drawBullets();
                        this.drawEnemyBullets();
                        this.drawMagicalImpactEffects(); // Efeitos de impacto
                        this.drawDashEffects(); // Efeitos de dash
                        this.drawSpecialAbilities(); // Desenhar habilidades especiais
                        this.drawGrabberHook(); // Desenhar hook do modo Grabber
                        this.drawPlayer();
                        this.drawSpecialAbilityCooldown(); // Indicador de cooldown do Q
                        this.drawDashAbilityCooldown(); // Indicador de cooldown do E
                    }
                    
                    // Desenhar cursor customizado sempre por último (fica por cima de tudo)
                    this.drawCustomCursor();
                }
                
                gameLoop(timestamp = 0) {
                    // Sistema de FPS mais fluido
                    const targetFPS = 60;
                    const targetFrameTime = 1000 / targetFPS;
                    
                    if (!this.lastTime) this.lastTime = timestamp;
                    const deltaTime = timestamp - this.lastTime;
                    
                    // Limitar deltaTime para evitar pulos grandes
                    const clampedDeltaTime = Math.min(deltaTime, targetFrameTime * 2);
                    
                    // Acumular tempo para manter FPS constante
                    this.frameTimeAccumulator = (this.frameTimeAccumulator || 0) + clampedDeltaTime;
                    
                    // Processar múltiplos frames se necessário para catch-up
                    let frameCount = 0;
                    while (this.frameTimeAccumulator >= targetFrameTime && frameCount < 3) {
                        // Processar atualizações apenas quando necessário
                        if (this.gameStarted && !this.gameOver) {
                            this.updatePlayer();
                            this.updateEnemies();
                            this.updateBullets();
                            this.updateEnemyBullets();
                            this.updateSpecialAbilities();
                            this.updateGrabberHook(); // Hook do modo Grabber
                            this.updateSpecialAbilityCastEffects(); // Novo efeito
                            this.updateMagicalImpactEffects(); // Efeitos de impacto
                            this.updateDashEffects(); // Efeitos de dash
                            this.updateClickEffect();
                            
                            // Limpeza periódica de memória mais frequente
                            if (this.frameCount % 180 === 0) { // A cada 3 segundos
                                this.cleanupMemory();
                            }
                            
                            // Limpeza específica de projéteis especiais ainda mais frequente
                            if (this.frameCount % 60 === 0) { // A cada 1 segundo
                                if (this.specialAbility.projectiles.length > 3) {
                                    this.specialAbility.projectiles = this.specialAbility.projectiles.slice(0, 3);
                                }
                            }
                    
                            // Spawn de inimigos baseado em frames
                            this.enemySpawnTimer++;
                            if (this.enemySpawnTimer >= this.enemySpawnRate) {
                                this.spawnEnemy();
                                this.enemySpawnTimer = 0;
                    
                                // Diminui o intervalo de spawn gradualmente
                                if (this.enemySpawnRate > 45) { // Mínimo mais baixo
                                    this.enemySpawnRate -= 2; // Redução mais suave
                                }
                            }
                            
                            this.frameCount = (this.frameCount || 0) + 1;
                        }
                        
                        this.frameTimeAccumulator -= targetFrameTime;
                        frameCount++;
                    }
                    
                    // Sempre renderizar
                    this.render();
                    
        this.lastTime = timestamp;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // ========== MODO JUNGLER - MINI-GAME DE TIMING ==========
    
    startJunglerMode() {
        this.junglerGameScreen.style.display = 'flex';
        this.junglerGameScreen.style.opacity = '0';
        this.junglerGameScreen.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            this.junglerGameScreen.style.opacity = '1';
        }, 100);
        
        // Resetar estat\u00edsticas
        this.junglerGame.hits = 0;
        this.junglerGame.misses = 0;
        this.updateJunglerStats();
        
        // Iniciar primeira rodada
        this.startJunglerRound();
    }
    
    exitJunglerMode() {
        this.junglerGame.active = false;
        if (this.junglerGame.animationFrame) {
            cancelAnimationFrame(this.junglerGame.animationFrame);
        }
        
        this.junglerGameScreen.style.opacity = '0';
        setTimeout(() => {
            this.junglerGameScreen.style.display = 'none';
            this.showModeSelection();
        }, 500);
    }
    
    updateInstructionsPanel() {
        if (!this.instructionsContent) return;
        
        let instructionsHTML = '';
        
        if (this.selectedMode === 'laner') {
            instructionsHTML = `
                <p><i class="fas fa-mouse-pointer"></i> <strong>Movimento:</strong> Clique esquerdo para se mover</p>
                <p><i class="fas fa-crosshairs"></i> <strong>Ataque:</strong> Clique direito em um inimigo para atacar</p>
                <p><i class="fas fa-circle"></i> <strong>Range Limitado:</strong> Não saia do círculo verde</p>
                <p><i class="fas fa-heart"></i> <strong>Vida:</strong> 3 acertos de tiros vermelhos = morte</p>
                <p><i class="fas fa-trophy"></i> <strong>Objetivo:</strong> Sobreviva e maximize sua pontuação</p>
            `;
        } else if (this.selectedMode === 'grabber') {
            instructionsHTML = `
                <p><i class="fas fa-mouse-pointer"></i> <strong>Movimento:</strong> Clique esquerdo para se mover</p>
                <p><i class="fas fa-hand-rock"></i> <strong>Hook:</strong> Clique direito para lançar o gancho</p>
                <p><i class="fas fa-clock"></i> <strong>Cooldown:</strong> Aguarde o cooldown entre hooks</p>
                <p><i class="fas fa-circle"></i> <strong>Range Limitado:</strong> Não saia do círculo verde</p>
                <p><i class="fas fa-trophy"></i> <strong>Objetivo:</strong> Acerte os hooks e elimine inimigos</p>
            `;
        }
        
        this.instructionsContent.innerHTML = instructionsHTML;
    }
    
    exitLanerMode() {
        // Parar o jogo
        this.gameStarted = false;
        this.gameOver = false;
        
        // Limpar elementos do jogo
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        
        // Esconder UI do jogo
        this.uiOverlay.style.display = 'none';
        this.instructionsPanel.style.display = 'none';
        this.canvas.classList.remove('game-active');
        
        // Desativar modo grabber se estava ativo
        this.grabberMode.active = false;
        
        // Mostrar seleção de modo novamente
        this.showModeSelection();
    }
    
    startGrabberMode() {
        this.grabberMode.active = true;
        this.showMainMenu();
    }
    
    startJunglerRound() {
        // Resetar sa\u00fade
        this.junglerGame.currentHealth = this.junglerGame.maxHealth;
        this.junglerGame.canSmite = true;
        this.junglerGame.active = true;
        
        // Velocidade aleat\u00f3ria de drenagem (entre 2.5 e 5.5 HP por frame - mais r\u00e1pido)
        this.junglerGame.drainSpeed = 2.5 + Math.random() * 3;
        
        // Gerar valor alvo aleat\u00f3rio entre 450, 900 e 1200
        const smiteValues = [450, 900, 1200];
        this.junglerGame.targetValue = smiteValues[Math.floor(Math.random() * smiteValues.length)];
        this.fastTargetValue.textContent = this.junglerGame.targetValue;
        
        // Zona de smite aleat\u00f3ria pr\u00f3xima ao final (entre 5% e 15% da vida)
        const minThreshold = 50; // 5%
        const maxThreshold = 150; // 15%
        this.junglerGame.smiteThreshold = minThreshold + Math.random() * (maxThreshold - minThreshold);
        
        // Atualizar posi\u00e7\u00e3o visual da zona de smite
        const zonePercent = (this.junglerGame.smiteThreshold / this.junglerGame.maxHealth) * 100;
        this.smiteZone.style.width = `${zonePercent}%`;
        
        // Iniciar anima\u00e7\u00e3o de drenagem
        this.drainHealth();
    }
    
    drainHealth() {
        if (!this.junglerGame.active) return;
        
        this.junglerGame.currentHealth -= this.junglerGame.drainSpeed;
        
        // Verificar se chegou a zero
        if (this.junglerGame.currentHealth <= 0) {
            this.junglerGame.currentHealth = 0;
            this.handleMissedSmite();
            return;
        }
        
        // Atualizar UI
        this.updateHealthBar();
        
        // Verificar se está no range de smite (±150)
        const currentValue = Math.ceil(this.junglerGame.currentHealth);
        const targetValue = this.junglerGame.targetValue;
        const difference = Math.abs(currentValue - targetValue);
        
        if (difference <= 150 && this.dragonGlow) {
            this.dragonGlow.classList.add('active');
        } else if (this.dragonGlow) {
            this.dragonGlow.classList.remove('active');
        }
        
        // Continuar drenagem
        this.junglerGame.animationFrame = requestAnimationFrame(() => this.drainHealth());
    }
    
    updateHealthBar() {
        const healthPercent = (this.junglerGame.currentHealth / this.junglerGame.maxHealth) * 100;
        this.healthBarFill.style.width = `${healthPercent}%`;
        this.healthBarText.textContent = `${Math.ceil(this.junglerGame.currentHealth)} / ${this.junglerGame.maxHealth}`;
        
        // Mudar cor da barra quando est\u00e1 pr\u00f3xima do fim
        if (this.junglerGame.currentHealth <= this.junglerGame.smiteThreshold) {
            this.healthBarFill.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
        } else if (this.junglerGame.currentHealth <= 300) {
            this.healthBarFill.style.background = 'linear-gradient(90deg, #ff9800, #ff5722)';
        } else {
            this.healthBarFill.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
        }
    }
    
    attemptSmite() {
        if (!this.junglerGame.canSmite || !this.junglerGame.active) return;

        // Parar drenagem imediatamente
        this.junglerGame.canSmite = false;
        this.junglerGame.active = false;
        
        // Cancelar anima\u00e7\u00e3o de drenagem
        if (this.junglerGame.animationFrame) {
            cancelAnimationFrame(this.junglerGame.animationFrame);
        }

        // Executar anima\u00e7\u00e3o de lightning vermelho
        if (this.lightningEffect) {
            this.lightningEffect.stop();
            this.lightningEffect.style.opacity = '1';
            this.lightningEffect.play();
            
            setTimeout(() => {
                this.lightningEffect.style.opacity = '0';
            }, 600);
        }

        // Calcular a diferen\u00e7a entre o valor atual da vida e o valor alvo
        const currentValue = Math.ceil(this.junglerGame.currentHealth);
        const targetValue = this.junglerGame.targetValue;
        const difference = targetValue - currentValue; // Diferen\u00e7a com sinal
        
        // Sistema de precis\u00e3o:
        // Se apertou ANTES (currentValue > targetValue): ERRO
        // Se apertou DEPOIS mas dentro de -50: PERFEITO
        // Se apertou DEPOIS mas dentro de -150: BOM
        // Se apertou DEPOIS com diferen\u00e7a > 150: ERRO
        
        if (currentValue > targetValue) {
            // Apertou antes do valor necess\u00e1rio - ERRO
            this.handleFailedSmite(Math.abs(difference), currentValue, targetValue);
        } else if (difference <= 50) {
            // Apertou depois, muito pr\u00f3ximo - PERFEITO
            this.handlePerfectSmite(Math.abs(difference));
        } else if (difference <= 150) {
            // Apertou depois, no range aceit\u00e1vel - BOM
            this.handleGoodSmite(Math.abs(difference));
        } else {
            // Apertou depois, mas muito tarde - ERRO
            this.handleFailedSmite(Math.abs(difference), currentValue, targetValue);
        }
    }
    
    handlePerfectSmite(difference) {
        this.junglerGame.hits++;
        
        // Feedback visual
        if (this.berserkerImage) {
            this.berserkerImage.classList.add('hit-success');
        }
        this.showFeedback(`PERFEITO! (\u00b1${difference})`, true);

        // Resetar vida para zero com efeito
        this.junglerGame.currentHealth = 0;
        this.updateHealthBar();

        setTimeout(() => {
            if (this.berserkerImage) {
                this.berserkerImage.classList.remove('hit-success');
            }
            this.updateJunglerStats();
            
            // Iniciar nova rodada ap\u00f3s 1.5 segundos
            setTimeout(() => {
                this.startJunglerRound();
            }, 1500);
        }, 500);
    }
    
    handleGoodSmite(difference) {
        this.junglerGame.hits++;
        
        // Feedback visual
        if (this.berserkerImage) {
            this.berserkerImage.classList.add('hit-success');
        }
        this.showFeedback(`BOM! (\u00b1${difference})`, true);

        // Resetar vida para zero com efeito
        this.junglerGame.currentHealth = 0;
        this.updateHealthBar();

        setTimeout(() => {
            if (this.berserkerImage) {
                this.berserkerImage.classList.remove('hit-success');
            }
            this.updateJunglerStats();

            // Iniciar nova rodada ap\u00f3s 1.5 segundos
            setTimeout(() => {
                this.startJunglerRound();
            }, 1500);
        }, 500);
    }

    handleFailedSmite(difference, currentValue, targetValue) {
        this.junglerGame.misses++;

        // Feedback visual
        if (this.berserkerImage) {
            this.berserkerImage.classList.add('hit-fail');
        }
        let message = `ERROU! (${currentValue} vs ${targetValue})`;
        if (currentValue > targetValue) {
            message = `MUITO CEDO! (\u00b1${difference})`;
        } else {
            message = `MUITO TARDE! (\u00b1${difference})`;
        }
        
        this.showFeedback(message, false);

        setTimeout(() => {
            if (this.berserkerImage) {
                this.berserkerImage.classList.remove('hit-fail');
            }
            this.updateJunglerStats();

            // Iniciar nova rodada ap\u00f3s 1.5 segundos
            setTimeout(() => {
                this.startJunglerRound();
            }, 1500);
        }, 500);
    }
    
    handleMissedSmite() {
        // Vida chegou a zero sem smite
        this.junglerGame.misses++;
        this.junglerGame.active = false;
        
        if (this.berserkerImage) {
            this.berserkerImage.classList.add('hit-fail');
        }
        this.showFeedback('SEM SMITE!', false);
        
        setTimeout(() => {
            if (this.berserkerImage) {
                this.berserkerImage.classList.remove('hit-fail');
            }
            this.updateJunglerStats();
            
            // Iniciar nova rodada ap\u00f3s 1.5 segundos
            setTimeout(() => {
                this.startJunglerRound();
            }, 1500);
        }, 500);
    }
    
    showFeedback(message, isSuccess) {
        this.junglerFeedback.textContent = message;
        this.junglerFeedback.className = 'jungler-feedback';
        
        if (isSuccess) {
            this.junglerFeedback.classList.add('show-success');
        } else {
            this.junglerFeedback.classList.add('show-fail');
        }
        
        setTimeout(() => {
            this.junglerFeedback.className = 'jungler-feedback';
        }, 1000);
    }
    
    updateJunglerStats() {
        this.junglerHits.textContent = this.junglerGame.hits;
        this.junglerMisses.textContent = this.junglerGame.misses;
        
        const total = this.junglerGame.hits + this.junglerGame.misses;
        const accuracy = total > 0 ? ((this.junglerGame.hits / total) * 100).toFixed(1) : 0;
        this.junglerAccuracy.textContent = `${accuracy}%`;
    }
}

// Inicializar o sistema de dark mode
const darkModeManager = new DarkModeManager();

// Inicializar o jogo
const game = new Game();