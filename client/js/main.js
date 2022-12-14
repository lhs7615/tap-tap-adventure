
/* global Types */

define(['jquery', 'app', 'entrypoint', 'characterdialog',
    'button2', 'dialog', 'iteminfodialog', 'game', 'bubble', 'settings'], function($, App, EntryPoint, Settings) {
    var app, game;

    var initApp = function() {
        $(document).ready(function() {
            app = new App();
            app.center();

            if(Detect.isWindows()) {
                // Workaround for graphical glitches on text
                $('body').addClass('windows');
            }

            if(Detect.isOpera()) {
                // Fix for no pointer events
                $('body').addClass('opera');
            }

            if(Detect.isFirefoxAndroid()) {
                // Remove chat placeholder
                $('#chatinput').removeAttr('placeholder');
            }

            $('body').click(function(event) {
                if($('#parchment').hasClass('credits')) {
                    app.toggleScrollContent('credits');
                }

                if($('#parchment').hasClass('legal')) {
                    app.toggleScrollContent('legal');
                }

                if($('#parchment').hasClass('about')) {
                    app.toggleScrollContent('about');
                }
            });

            $('.barbutton').click(function() {
                $(this).toggleClass('active');
            });

            $('#population').click(function() {
                app.togglePopulationInfo();
            });

            $('.clickable').click(function(event) {
                event.stopPropagation();
            });

            $('#toggle-credits').click(function() {
                app.toggleScrollContent('credits');
            });

            $('#toggle-legal').click(function() {
                app.toggleScrollContent('legal');
                if(game.renderer.mobile)
                    $(this).text($('#parchment').hasClass('legal') ? 'Close' : 'Privacy');

            });

            $('#create-new span').click(function() {
                app.animateParchment('loadcharacter', 'confirmation');
            });

            $('#change-password span').click(function() {
                app.animateParchment('loadcharacter', 'changePassword');
            });

            $('#continue span').click(function() {

                app.animateParchment('confirmation', 'createcharacter');
                $('body').removeClass('returning');
                app.clearValidationErrors();
            });

            $('#cancel span').click(function() {

                if ($('#parchment').hasClass('confirmation'))
                    app.animateParchment('confirmation', 'loadcharacter');
                else if ($('#parchment').hasClass('createcharacter'))
                    app.animateParchment('createcharacter', 'loadcharacter');

            });

            $('.ribbon').click(function() {
                app.toggleScrollContent('about');
            });

            // Create New Character fields
            $('#nameinput').bind("keyup", function() {
                app.toggleButton();
            });
            $('#pwinput').bind("keyup", function() {
                app.toggleButton();
            });
            $('#pwinput2').bind("keyup", function() {
                app.toggleButton();
            });
            $('#emailinput').bind("keyup", function() {
                app.toggleButton();
            });

            // Change Password Fields.
            $('#cpnameinput').bind("keyup", function() {
                app.toggleButton();
            });
            $('#cppwinputold').bind("keyup", function() {
                app.toggleButton();
            });
            $('#cppwinput').bind("keyup", function() {
                app.toggleButton();
            });
            $('#cppwinput2').bind("keyup", function() {
                app.toggleButton();
            });


            $('#notifications div').bind(TRANSITIONEND, app.resetMessagesPosition.bind(app));

            $('.close').click(function() {
                app.hideWindows();
            });

            $('.twitter').click(function() {
                var url = $(this).attr('href');

                app.openPopup('twitter', url);
                return false;
            });

            $('.facebook').click(function() {
                var url = $(this).attr('href');

                app.openPopup('facebook', url);
                return false;
            });



            $('.play span').click(function(event) {
                app.tryStartingGame();
            });

            document.addEventListener("touchstart", function() {},false);
            document.addEventListener('touchmove', function(e) { e.preventDefault(); });
            $('#resize-check').bind("transitionend", app.resizeUi.bind(app));
            $('#resize-check').bind("webkitTransitionEnd", app.resizeUi.bind(app));
            $('#resize-check').bind("oTransitionEnd", app.resizeUi.bind(app));
            
            log.info("App initialized.");

            initGame();
        });
    };

    var initGame = function() {
        require(['game', 'button2'], function(Game, Button2) {
            log.info("Initialized Game.");

            var canvas = document.getElementById("entities"),
                backgroundbuffer = document.getElementById("backgroundbuffer"),
                background = document.getElementById("background"),
                foreground = document.getElementById("foreground"),
                textcanvas = document.getElementById("textcanvas"),
                toptextcanvas = document.getElementById("toptextcanvas"),
                input = document.getElementById("chatinput");

            game = new Game(app);

            game.setup('#bubbles', canvas, backgroundbuffer, background, foreground, textcanvas, toptextcanvas, input);

            app.setGame(game);
            

            game.onNbPlayersChange(function(worldPlayers, totalPlayers){
                $('#users').html("" + totalPlayers);
            });

            game.onGameStart(function() {
                $('#parchment').removeClass();
                //$('#chatLog').css('visibility', 'hidden');
                var entry = new EntryPoint();
                entry.execute(game);
            });

            game.onDisconnect(function(message) {
                var reloadMessage = game.renderer.mobile ? "You have been disconnected, the page will refresh within 5 seconds." : message + "<em>Click anywhere to reload the page.</em>";
                $('#death').find('p').html(reloadMessage);
                game.isDisconnected = true;
                if (game.renderer.mobile) {

                    setInterval(function() {
                        location.reload();
                    }, 5000)

                }
                $('#respawn').hide();
            });

            game.onPlayerDeath(function() {
                if($('body').hasClass('credits'))
                    $('body').removeClass('credits');

                $('body').addClass('death');
            });

            game.onNotification(function(message) {
                app.showMessage(message);
            });

            app.initHealthBar();
            app.initManaBar();
            app.initExpBar();
            $('#nameinput').attr('value', '');
            $('#pwinput').attr('value', '');
            $('#pwinput2').attr('value', '');
            $('#emailinput').attr('value', '');
            $('#chatbox').attr('value', '');
            var settings = new Settings();
            var ax, ay, bx, by;

            $('#canvas .clickable').click(function(event) {
                app.center();
                app.setMouseCoordinates(event);
                if(game && !app.dropDialogPopuped)
                    game.click();

                app.hideWindows();
            });

            $('#canvas .clickable').bind('dragover', function(event) {
                event.preventDefault();
            });

            $('#canvas .clickable').bind('dragenter', function(event) {
                if(DragDataInv && DragDataInv.invNumber) {
                    game.dropItem(DragDataInv.invNumber);
                    DragDataInv.invNumber = null;
                }
            });


            //$('body').unbind('click');
            $('body').click(function(event) {
                var hasClosedParchment = false;

                if($('#parchment').hasClass('credits')) {
                    if(game.started) {
                        app.closeInGameScroll('credits');
                        hasClosedParchment = true;
                    } else {
                        app.toggleScrollContent('credits');
                    }
                }

                if($('#parchment').hasClass('legal')) {
                    if(game.started) {
                        app.closeInGameScroll('legal');
                        hasClosedParchment = true;
                    } else {
                        app.toggleScrollContent('legal');
                    }
                }

                if($('#parchment').hasClass('about')) {
                    if(game.started) {
                        app.closeInGameScroll('about');
                        hasClosedParchment = true;
                    } else {
                        app.toggleScrollContent('about');
                    }
                }

                if (game.isDisconnected)
                    location.reload();

            });

            $('#respawn').click(function(event) {
                game.audioManager.playSound("revive");
                game.respawn();
                $('body').removeClass('death');
            });

            if (game.renderer) {
                this.scale = game.renderer.getScaleFactor();
                
                if (game.renderer.mobile)
                    this.scale = 1;
            }

            $('#instructions').click(function() {
                app.hideWindows();
            });

            $('#characterButton').click(function(event) {
                //app.showChat();

                $('#characterButton').toggleClass('active');

                if ($('#characterButton').hasClass('active')) {
                    game.client.sendCharacterInfo();
                    if ($('#inventoryButton').hasClass('active')) {
                        $('#inventoryButton').toggleClass('active');
                        game.inventoryHandler.toggleAllInventory();
                    }
                } else
                    game.characterDialog.hide();
            });

            $('#inventoryButton').click(function(event) {
                $('#inventoryButton').toggleClass('active');
                game.inventoryHandler.toggleAllInventory();

                if ($('#characterButton').hasClass('active')) {
                    $('#characterButton').toggleClass('active');
                    game.characterDialog.hide();
                }
            });

            $('#warpbutton').click(function(event) {
                //$('#warpbutton').toggleClass('active');
                game.showGraphicNotification("This feature is under construction!")

            });

            $('#chatbutton').click(function(event) {
                $('#chatbutton').toggleClass('active');

                if ($('#inventoryButton').hasClass('active')) {
                    $('#inventoryButton').toggleClass('active');
                    game.inventoryHandler.toggleAllInventory();
                }

                if ($('#characterButton').hasClass('active')) {
                    $('#characterButton').toggleClass('active');
                    game.characterDialog.hide();
                }

                if ($('#chatbutton').hasClass('active'))
                    app.showChat();
                else
                    app.hideChat();

            });

            $('#soundbutton').click(function(event) {
                $('#soundbutton').toggleClass('active');
                game.audioManager.toggle();
            });

            $(document).mousemove(function(event) {
                app.setMouseCoordinates(event);
                if(game.started) {
                    // game.pvpFlag = event.shiftKey;
                    game.movecursor();
                }
            });
            $(document).bind('mousedown', function(event){
                if(event.button === 2){
                    return false;
                }
            });
            $(document).bind('mouseup', function(event) {
                if(event.button === 2) {
                    app.setMouseCoordinates(event);
                    game.rightClick();
                }
            });


            $(document).keyup(function(e) {
                var key = e.which;

                if (game.player && game.started && !$('#chatbox').hasClass('active')) {
                    switch(key) {
                        case Types.Keys.LEFT:
                        case Types.Keys.A:
                        case Types.Keys.KEYPAD_4:
                            game.player.moveLeft = false;
                            game.player.disableKeyboardNpcTalk = false;
                            break;
                        case Types.Keys.RIGHT:
                        case Types.Keys.D:
                        case Types.Keys.KEYPAD_6:
                            game.player.moveRight = false;
                            game.player.disableKeyboardNpcTalk = false;
                            break;
                        case Types.Keys.UP:
                        case Types.Keys.W:
                        case Types.Keys.KEYPAD_8:
                            game.player.moveUp = false;
                            game.player.disableKeyboardNpcTalk = false;
                            break;
                        case Types.Keys.DOWN:
                        case Types.Keys.S:
                        case Types.Keys.KEYPAD_2:
                            game.player.moveDown = false;
                            game.player.disableKeyboardNpcTalk = false;
                            break;
                        default:
                            break;
                    }
                }
            });

            $(document).keydown(function(e) {
                var key = e.which,
                    $chat = $('#chatinput');

                if ($('#inventoryButton').hasClass('active')) {
                    $('#inventoryButton').toggleClass('active');
                    game.inventoryHandler.toggleAllInventory();
                }

                if ($('#characterButton').hasClass('active')) {
                    $('#characterButton').toggleClass('active');
                    game.characterDialog.hide();
                }

                if ($('#achievements').hasClass('active'))
                    $('#achievements').toggleClass('active');

                if(key === Types.Keys.ENTER) {
                    if($('#chatbox').hasClass('active')) {
                        app.hideChat();
                    } else {
                        app.showChat();
                    }
                }

                if (game.player && game.started && !$('#chatbox').hasClass('active')) {
                    pos = {
                        x: game.player.gridX,
                        y: game.player.gridY
                    };
                    switch(key) {
                        case Types.Keys.LEFT:
                        case Types.Keys.A:
                        case Types.Keys.KEYPAD_4:

                            game.player.moveLeft = true;
                            break;
                        case Types.Keys.RIGHT:
                        case Types.Keys.D:
                        case Types.Keys.KEYPAD_6:
                            game.player.moveRight = true;
                            break;
                        case Types.Keys.UP:
                        case Types.Keys.W:
                        case Types.Keys.KEYPAD_8:
                            game.player.moveUp = true;
                            break;
                        case Types.Keys.DOWN:
                        case Types.Keys.S:
                        case Types.Keys.KEYPAD_2:
                            game.player.moveDown = true;
                            break;
                        case Types.Keys.SPACE:
                            game.makePlayerAttackNext();
                            break;
                        case Types.Keys.H:
                            $('#helpbutton').click();
                            break;
                        case Types.Keys.M:
                            $('#mutebutton').click();
                            break;
                        case Types.Keys.P:
                            if (game.partyHandler)
                            {
                                //alert("P pressed");
                                game.partyHandler.show();
                            }

                            break;
                        default:
                            break;
                    }
                }
            });

            $(document).keyup(function(e) {
                var key = e.which;


            });

            $('#chatinput').keydown(function(e) {
                var key = e.which,
                    $chat = $('#chatinput'),
                    placeholder = $(this).attr("placeholder");

                if(key === 13) {
                    if($chat.val() !== '') {
                        if(game.player)
                            game.say($chat.val());

                        $chat.attr('value', '');
                        app.hideChat();
                        $('#foreground').focus();
                        return false;
                    } else {
                        app.hideChat();
                        return false;
                    }
                }

                if(key === 27) {
                    app.hideChat();
                    return false;
                }
            });

            $('#chatinput').focus(function(e) {



                var placeholder = $(this).attr("placeholder");

                if(!Detect.isFirefoxAndroid()) {
                    $(this).val(placeholder);
                }

                if ($(this).val() === placeholder) {
                    this.setSelectionRange(0, 0);
                }
            });


            $('#dropAccept').click(function(event) {
                try {
                    var count = parseInt($('#dropCount').val());
                    if(count > 0) {
                        if(count > game.inventoryHandler.inventoryCount[app.inventoryNumber])
                            count = game.inventoryHandler.inventoryCount[app.inventoryNumber];

                        game.client.sendInventory("empty", app.inventoryNumber, count);

                        game.inventoryHandler.inventoryCount[app.inventoryNumber] -= count;
                        if(game.inventoryHandler.inventoryCount[app.inventoryNumber] === 0)
                            game.inventoryHandler.inventory[app.inventoryNumber] = null;
                    }
                } catch(e) {
                }

                setTimeout(function () {
                    app.hideDropDialog();
                }, 100);

            });

            $('#dropCancel').click(function(event) {
                setTimeout(function () {
                    app.hideDropDialog();
                }, 100);

            });

            $('#auctionSellAccept').click(function(event) {
                try {
                    var count = parseInt($('#auctionSellCount').val());
                    if(count > 0) {
                        game.client.sendAuctionSell(app.inventoryNumber,count);
                        game.inventoryHandler.inventory[app.inventoryNumber] = null;
                    }
                } catch(e) {
                }

                setTimeout(function () {
                    app.hideAuctionSellDialog();
                }, 100);

            });

            $('#auctionSellCancel').click(function(event) {
                setTimeout(function () {
                    app.hideAuctionSellDialog();
                }, 100);

            });



            $('#nameinput').focusin(function() {


                $('#name-tooltip').addClass('visible');

            });

            $('#nameinput').focusout(function() {
                $('#name-tooltip').removeClass('visible');
                
            });

            $('#nameinput').keypress(function(event) {
                $('#name-tooltip').removeClass('visible');
            });

            $('#next').click(function() {
                if ($('#achievements').hasClass('active')) {
                    var $achievements = $('#achievements'),
                        $lists = $('#lists'),
                        nbPages = 10;

                    if(app.currentPage === nbPages) {
                        return false;
                    } else {
                        app.currentPage += 1;
                        $achievements.removeClass().addClass('active page' + app.currentPage);
                    }
                }
            });

            $('#previous').click(function() {
                if ($('#achievements').hasClass('active')) {
                    log.info("Achievements active..");
                    var $achievements = $('#achievements');

                    if(app.currentPage === 1) {
                        return false;
                    } else {
                        app.currentPage -= 1;
                        $achievements.removeClass().addClass('active page' + app.currentPage);
                    }
                }
            });

            $('#mutebutton').click(function() {
                game.audioManager.toggle();
            });

            $('#helpbutton').click(function() {
                app.toggleAchievements(true);
                if (game.achievementHandler.blinkInterval) {
                    clearInterval(game.achievementHandler.blinkInterval);
                    $('#helpbutton').removeClass('blink');
                }

                if ($('#inventoryButton').hasClass('active')) {
                    $('#inventoryButton').toggleClass('active');
                    game.inventoryHandler.toggleAllInventory();
                }

                if ($('#characterButton').hasClass('active')) {
                    $('#characterButton').toggleClass('active');
                    game.characterDialog.hide();
                }
            });



            $(document).bind("keydown", function(e) {
                var key = e.which,
                    $chat = $('#chatinput');

                if(key === 13) { // Enter
                    if(game.started) {
                        $chat.focus();
                        return false;
                    } else {
                        if (app.loginFormActive() || app.createNewCharacterFormActive())
                        {
                            $('input').blur();      // exit keyboard on mobile
                            app.tryStartingGame();
                            return false;           // prevent form submit
                        }
                    }
                }

                //if($('#chatinput:focus').size() === 0 && $('#nameinput:focus').size() === 0) {
                if (app.loginFormActive() || app.createNewCharacterFormActive() || $chat.is(":focus"))
                {
                    //game.keyDown(key);
                    //alert("aborting since not started");
                    //log.info("login or create new character true");
                    return true;
                }

                if(key === 27) { // ESC
                    app.hideWindows();
                    return false;
                }
                if(game.ready &&
                    !app.dropDialogPopuped &&
                    !app.auctionsellDialogPopuped &&
                    !game.statehandler.buyingArcher &&
                    !game.statehandler.changingPassword  &&
                    !game.shopHandler.shown &&
                    !game.storeDialog.visible) {
                    if (key >= 49 && key <= 54) { // 1 to 6 for now
                        game.keyDown(key);
                        return false;
                    } else if (key === 107)// +
                        game.chathandler.incChatWindow();
                    else if (key === 109)
                        game.chathandler.decChatWindow();
                    else if ([81, 69, 82, 84, 89].indexOf(key) >= 0 && game.ready && game.player) { // q, e, r, t, y
                        game.player.skillHandler.execute(key);
                        return false;
                    }
                    if (key === 32) { // Space
                        game.togglePathingGrid();
                        return false;
                    }

                    if (key == 66)
                        game.inventoryHandler.toggleAllInventory();

                    if (key == 67) { // C for Character
                        //if(game && game.ready) {
                        if(game.characterDialog.visible) {
                            game.characterDialog.hide();
                        } else {
                            game.client.sendCharacterInfo();
                        }
                        //}
                    }

                    if (key == 76)
                        $('#achievementsbutton').click();

                    if (key == 77) // M for Music
                    {
                        //if(game && game.ready) {
                        if(game.audioManager.toggle())
                            game.soundButton.down();
                        else
                            game.soundButton.up();
                    }

                }
            });

            $('#healthbar').click(function(e) {
                var hb = $('#healthbar'),
                    hp = $('#hitpoints'),
                    hpg = $('#hpguide');

                var hbp = hb.position(),
                    hpp = hp.position();

                if((e.offsetX >= hpp.left) && (e.offsetX < hb.width())) {
                    if(hpg.css('display') === 'none') {
                        hpg.css('display', 'block');

                        setInterval(function () {
                            if(((game.player.hitPoints / game.player.maxHitPoints) <= game.hpGuide) &&
                                (game.healShortCut >= 0) &&
                                ItemTypes.isConsumableItem(game.player.inventory[game.healShortCut]) &&
                                (game.player.inventoryCount[game.healShortCut] > 0)) {
                                game.eat(game.healShortCut);
                            }
                        }, 100);
                    }
                    hpg.css('left', e.offsetX + 'px');

                    game.hpGuide = (e.offsetX - hpp.left) / (hb.width()- hpp.left);
                }

                return false;
            });
            if(game.renderer.tablet)
                $('body').addClass('tablet');
        });

        $(window).blur(function(){
            if (game.client && game.player && game.started) {
                if (game.renderer.mobile)
                    game.audioManager.setOff();
            }
        });
        $(window).focus(function() {
            if (game.client && game.player && game.started) {
                if (game.renderer.mobile && !game.audioManager.switchDisabled)
                    game.audioManager.setOn();
            }
        });

    };

    initApp();
});
