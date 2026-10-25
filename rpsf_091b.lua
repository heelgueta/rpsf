-- rpsf battle  v1.0

-- a turn-based micro-strategy card game in 4 buttons
-- by monxow, 2025
-- ðª¨ðâï¸ð§¼
-- p1 vs p2 / bot / smart bot
-- custom stat mode + foam soul mechanics
--
-- press  to begin
-- git gud or die foamy

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â               global vars               â
-- ââââââââââââââââââââââââââââââââââââââââââââ

menu_items = {
 "start: p1 vs p2",
 "start: p1 vs bot",
 "how to play",
 "custom mode",
 "credits"
}

menu_state = "main"
menu_idx = 1
game_mode = ""
bot_type = "random" -- "random" o "smart"
bot_idx = 1

custom_hearts = 0
custom_attack = 0
custom_cut = 0
custom_mode_selected = false

info_screen = "how"
menu_state = "main"


-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â            init + main functions        â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function _init()
 menu_state = "main"
end

function _update()
 if menu_state == "main" then
  update_main_menu()
 elseif menu_state == "info" then
  update_info()
 elseif menu_state == "custom" then
  update_custom_config()
 elseif menu_state == "bot_select" then
  update_bot_select()
 elseif menu_state == "game" then
  update_game()
 end
end

function _draw()
 if menu_state == "main" then
  draw_menu()
 elseif menu_state == "info" then
  draw_info()
 elseif menu_state == "custom" then
  draw_custom_config()
 elseif menu_state == "bot_select" then
  draw_bot_select()
 elseif menu_state == "game" then
  draw_game()
 end
end




-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â             menu + navigation           â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function draw_menu()
 -- fondo animado lento (cambia cada 2 seg aprox)
 local t = flr(time()/2) % 4
 local bg_palette = {0, 1, 2, 13} -- negro, gris, morado, fucsia
 local bg_color = bg_palette[t+1]
 cls(bg_color)

 -- mÃ¡scara para proteger zonas con texto
 local mask = {}
 for i=0,127 do
  mask[i]={}
  for j=0,127 do
   mask[i][j]=false
  end
 end

 function reserve_box(x,y,w,h)
  for i=x,x+w do
   for j=y,y+h do
    if i>=0 and i<128 and j>=0 and j<128 then
     mask[i][j]=true
    end
   end
  end
 end

 reserve_box(30, 40, 70, #menu_items*10 + 10) -- menÃº
 reserve_box(32, 18, 64, 12)                 -- tÃ­tulo
 reserve_box(0, 115, 128, 13)                -- footer (saca dibujos de abajo)

 -- dibujar sÃ­mbolos flotando solo donde se permite
 for f in all(float_syms) do
  f.x += f.dx
  f.y += f.dy
  if f.x < 0 or f.x > 128 then f.dx = -f.dx end
  if f.y < 0 or f.y > 128 then f.dy = -f.dy end

  local ix = flr(f.x)
  local iy = flr(f.y)
  if not mask[ix] or not mask[ix][iy] then
   print(f.sym, f.x, f.y, f.c(f.sym))
  end
 end

 -- tÃ­tulo
 print("rpsf battle v0.91b", 32, 20, 7)

 -- Ã­tems del menÃº
 for i,item in ipairs(menu_items) do
  local y = 40 + i * 10
  local color = i == menu_idx and 10 or 6
  print((i == menu_idx and "> " or "  ") .. item, 30, y, color)
 end

 -- pie
 print("hicealgo labs 2025", 35, 118, 11)
end



function draw_info()
 cls(0)
 local y = 4
 for line in all(get_info_lines()) do
  if line.text == "stats_line" then
   local x = 4
   print("+hp", x, y, 11)     -- green
   x += 28
   print("+atk", x, y, 10)    -- yellow
   x += 30
   print("+cut", x, y, 8)     -- red
  else
   print(line.text, 4, y, line.color)
  end
  y += 8
 end
end

function draw_bot_select()
 cls(0)
 print("choose bot:", 40, 30, 7)
 print((bot_idx==1 and "> " or "  ").."bot 1 (random)", 40, 50, bot_idx==1 and 11 or 6)
 print((bot_idx==2 and "> " or "  ").."bot 2 (smarter)", 40, 60, bot_idx==2 and 11 or 6)
end

function update_main_menu()
 if btnp(2) then
  menu_idx = (menu_idx - 2) % #menu_items + 1
 elseif btnp(3) then
  menu_idx = (menu_idx) % #menu_items + 1
 elseif btnp(4) then
  local choice = menu_items[menu_idx]

  if choice == "start: p1 vs p2" then
   game_mode = "pvp"
    menu_state = "game"

   init_game()

elseif choice == "start: p1 vs bot" then
 menu_state = "bot_select"

  elseif choice == "how to play" then
   info_screen = "how"
   menu_state = "info"

  elseif choice == "custom mode" then
   menu_state = "custom"

  elseif choice == "credits" then
   info_screen = "credits"
   menu_state = "info"
  end
 end
end



function get_info_lines()
 if info_screen == "how" then
  return {
   {text="--- how to play ---", color=10},
   {text="- rock usually beats scissors", color=7},
   {text="- paper usually beats rock", color=7},
   {text="- scissors usually beats paper", color=7},
   {text="- foam is weird on death", color=7},
   {text="", color=7},
   {text="on your turn:", color=7},
   {text="- choose a card", color=7},
   {text="- select an action:", color=7},
   {text="  attack / sacrifice / rest", color=7},
   {text="", color=7},
   {text="kill or sacrifice to get:", color=7},
   {text="stats_line"},
   {text="", color=7},
   {text="kill all enemy cards to win.", color=8}
  }

 elseif info_screen == "credits" then
  return {
   {text="--- credits ---", color=10},
   {text="", color=7},
   {text="design & code:", color=7},
   {text="monxow,", color=11},
   {text="hicealgo labs, 2025", color=11},

   {text="", color=7},
   {text="music: tbd (silence is sacred)", color=7},
   {text="testing: daughters, bots, rage", color=7},
   {text="", color=7},
   {text="git gud or perish in foam.", color=8}
  }
 end
end

function update_bot_select()
 if btnp(2) or btnp(3) then bot_idx = 3 - bot_idx end
 if btnp(4) then
  game_mode = bot_idx == 1 and "bot_random" or "bot_smart"
  menu_state = "game"
  init_game()
 end
end

function update_info()
if btnp(4) or btnp(5) then
  menu_state = "main"
 end
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â           game mode handler             â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function update_game()
 if game_mode == "pvp" then update_pvp()
 elseif game_mode == "bot_random" then update_bot_random()
 elseif game_mode == "bot_smart" then update_bot_smart()
 end
end

function draw_game()
 if game_mode == "pvp" or game_mode == "bot_random" or game_mode == "bot_smart" then
  draw_pvp()
 end
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â         game state & globals            â
-- ââââââââââââââââââââââââââââââââââââââââââââ

players = {
 {name="p1", x=7 , cards={}},
 {name="p2", x=67, cards={}}
}

card_types = {"r", "p", "s", "f"}
type_names = {r="rock", p="papr", s="sizr", f="foam"}

turn = 1
current_player = 1
state = "card"
menu_opts = {"attack", "sacrifice", "rest"}

sel_card, menu_idx, sel_target = 1, 1, 1
selected = nil
log = {}
rounds_no_kill = 0

transfer_mode = nil
transfer_step = 0
transfer_list, to_list = {}, {}
sel_idx, sel_cnt_idx, sel_to_idx = 1, 1, 1
sel_from = nil
sel_cnts = {}
sel_cnt = nil
sacrificial_foam = nil
killer_player = nil

end_timer = 0
winner_msg = ""

bot_step = 0
bot_timer = 0

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â               game init                 â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function init_game()
 for i=1,2 do players[i].cards = {} end
 for p in all(players) do
  for i=1,4 do
local h = 2 + (custom_mode_selected and custom_hearts or 0)
local a = (custom_mode_selected and custom_attack or 0)
local c = (custom_mode_selected and custom_cut or 0)
add(p.cards, {t=card_types[i], h=h, a=a, c=c, alive=true})
  end
 end

 turn = 1
 current_player = 1
 state = "card"
 sel_card, menu_idx, sel_target = 1, 1, 1
 selected = nil
 log = {}
 rounds_no_kill = 0
 transfer_mode = nil
 transfer_step = 0
 end_timer = 0
 winner_msg = ""
 log_add("start")
 bot_step = 0
 bot_timer = 0
 custom_mode_selected = (game_mode == "pvp" or game_mode == "bot_random" or game_mode == "bot_smart") and custom_mode_selected or false
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â             utility funcs               â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function log_add(s)
 if not s then return end
 s = tostr(s)
 s = sub(s, 1, 48)
 add(log, s)
end

function clear_log()
 log = {}
end

function current()
 return players[current_player]
end

function opponent()
 return players[3 - current_player]
end

function pname(id)
 return id == 1 and "p1" or "p2"
end

function title(c)
 return type_names[c.t]
end

function rep(sym, n)
 local o = ""
 for i=1,n do o..=sym end
 return o
end

function alive_cards(p)
 local r = {}
 for c in all(p.cards) do
  if c.alive then add(r, c) end
 end
 return r
end

function all_alive()
 local r = {}
 for pl in all(players) do
  for c in all(pl.cards) do
   if c.alive then add(r, c) end
  end
 end
 return r
end

function owner(card)
 for i=1,2 do
  for c in all(players[i].cards) do
   if c == card then return i end
  end
 end
 return 0
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â                combate                  â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function dmg_vs(a,b)
 if a.t=="f" then return a.a>0 and a.a or 0 end
 if b.t=="f" then return 1 + a.a end
 if a.t=="r" and b.t=="s" then return 2+a.a end
 if a.t=="p" and b.t=="r" then return 2+a.a end
 if a.t=="s" and b.t=="p" then return 2+a.a end
 if a.t==b.t then return 1+a.a end
 if a.a>0 then return 1 end
 return 0
end

function apply(c,d)
 c.h -= d
 if c.h <= 0 then
  c.h = 0
  c.alive = false
 end
end

function soul(k,v)
 if k.t == v.t and dmg_vs(k,v) >= v.h then
  k.h += 1
  log_add(pname(current_player)..k.t.."+")
 end
end

function loot(k,v)
 if v.alive or not k.alive then return end
 if v.t == "r" then
  k.a += 1
  log_add(pname(current_player)..k.t.."+")
 elseif v.t == "p" then
  k.h += 1
  log_add(pname(current_player)..k.t.."+")
 elseif v.t == "s" then
  k.c += 1
  log_add(pname(current_player)..k.t.."+")
 end
end

function attack(a,b)
 clear_log()
 log_add(pname(current_player)..a.t.." atk!")

 local d = dmg_vs(a,b)

 if b.h <= d then soul(a,b) end

 if d > 0 then
  apply(b,d)
  log_add(pname(3-current_player)..b.t.."-"..rep("",d))
  if not b.alive then
   log_add(pname(3-current_player)..b.t.." rip")
  end
 else
  log_add(pname(3-current_player)..b.t.." no dmg")
 end

 if b.c > 0 then
  apply(a,b.c)
  log_add(pname(current_player)..a.t.." cut-"..rep("",b.c))
 end

 loot(a,b)

 rounds_no_kill = (not b.alive or not a.alive) and 0 or rounds_no_kill + 1

 return (not b.alive and b.t == "f")
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â             turn system                 â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function reset_cursor()
 sel_card = 1
 while not current().cards[sel_card].alive do
  sel_card = (sel_card % 4) + 1
 end
end

function win_check()
 local a = #alive_cards(players[1])
 local b = #alive_cards(players[2])
 if a==0 and b==0 then winner_msg="tie!" return true end
 if a==0 then winner_msg=pname(2).." wins!" return true end
 if b==0 then winner_msg=pname(1).." wins!" return true end
 if rounds_no_kill >= 6 then winner_msg="stalemate" return true end
 return false
end

function end_turn()
 if win_check() then
  state = "game_over_wait"
  end_timer = 0
  return
 end

 selected = nil
 menu_idx = 1
 current_player = 3 - current_player
 reset_cursor()
 turn += 1
 state = "card"

 if (game_mode=="bot_random" or game_mode=="bot_smart") and current_player == 2 then
  bot_timer = 0
  bot_step = 0
 end
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â             draw helpers                â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function blink()
 if current_player == 1 then
  return (time() % 0.5 < 0.25) and 13 or 12
 else
  return (time() % 0.5 < 0.25) and 8 or 9
 end
end

function draw_card(c,x,y,sel,targ)
 rectfill(x,y,x+54,y+10,7) -- base
 print(title(c),x+2,y+3,0)

 local off = x + 2 + #title(c)*4 - 2
 print(""..c.h,off+2,y+3,11)
 print(""..c.a,off+14,y+3,10)
 print(""..c.c,off+26,y+3,8)

 if not c.alive then
  line(x,y,x+54,y+10,0)
  line(x+54,y,x,y+10,0)
 end

 if sel or targ then
  rect(x-1,y-1,x+55,y+11,blink())
 end
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â                draw game                â
-- ââââââââââââââââââââââââââââââââââââââââââââ

function draw_pvp()
 if state=="game_over_wait" or state=="game_over" then
  cls(0)
  print(winner_msg,64-#winner_msg*2,60,7)
if state=="game_over" then
local txt1 = ": play again"
local txt2 = ": reset game"
print(txt1, 64 - #txt1 * 2, 68, 7)
print(txt2, 64 - #txt2 * 2, 76, 7)
  end
  return
 end

if state == "transfer" then
 cls(2) -- morado suave
else
 cls(current_player == 1 and 12 or 8) -- azul o rojo segÃºn jugador
end

 -- marcos
 local y0 = 26
 rect(players[1].x-4, y0-4, players[1].x+56, y0+53, 5)
 rect(players[2].x-4, y0-4, players[2].x+56, y0+53, 5)

 -- tÃ­tulos
 print("p1 cards", players[1].x, 14, 0)
 print("p2 cards", players[2].x, 14, 0)

 -- header con turno
 local head="turn "..turn.." - "..current().name
 print(head,64-#head*2,2,0)

 -- las cartas
 for i=1,4 do
  local c1 = players[1].cards[i]
  local c2 = players[2].cards[i]
  local sel1 = (current_player==1 and state=="card" and sel_card==i)
  local sel2 = (current_player==2 and state=="card" and sel_card==i)
  local targ1 = (state=="attack_target" and opponent()==players[1] and sel_target==i and c1.alive) or
                (state=="sacrifice_target" and current()==players[1] and sel_target==i and c1.alive and c1~=selected)
  local targ2 = (state=="attack_target" and opponent()==players[2] and sel_target==i and c2.alive) or
                (state=="sacrifice_target" and current()==players[2] and sel_target==i and c2.alive and c2~=selected)

  -- si estamos transfiriendo cosas
  if state=="transfer" then
   if transfer_step==1 and transfer_list[sel_idx]==c1 then targ1=true end
   if transfer_step==1 and transfer_list[sel_idx]==c2 then targ2=true end
   if transfer_step==3 and to_list[sel_to_idx]==c1 then targ1=true end
   if transfer_step==3 and to_list[sel_to_idx]==c2 then targ2=true end
  end

  draw_card(c1, players[1].x, y0+(i-1)*13, sel1, targ1)
  draw_card(c2, players[2].x, y0+(i-1)*13, sel2, targ2)
 end

 -- barra inferior
 local my=118
 if state=="card" then
  rectfill(0, my-20, 128, my, current_player==1 and 12 or 8)
if mid(game_mode,1,3)=="bot" and current_player==2 then
   print("thinking...", 8, my-12, 0)
  else
   print(pname(current_player), 4, my-10, 0)
   print("choose card", 4, my-4, 0)
  end

 elseif state=="action" then
  print("choose action:",4,my-8,0)
  print("< ["..menu_opts[menu_idx].."] >",4,my,0)

 elseif state=="attack_target" then
  print("choose target",4,my,0)

 elseif state=="sacrifice_target" then
  print("who gets bonus?",4,my,0)

 elseif state=="transfer" then
  if transfer_step==1 then
   print("transfer from what card?",4,my,0)
  elseif transfer_step==2 then
   local s = sel_cnts[sel_cnt_idx] or "?"
   s = s=="h" and "" or s=="a" and "" or s=="c" and "" or s
   print("transfer what atribute?: "..s,4,my,0)
  else
   print("transfer to what card?",4,my,0)
  end
 end

 -- el log
 for i=6,1,-1 do
  local msg = log[#log-(6-i)]
  print(msg or "",64,my-40+(i-1)*7,0)
 end
end

-- ââââââââââââââââââââââââââââââââââââââââââââ
-- â        ð¹ï¸ lÃgica del modo pvp          â
-- ââââââââââââââââââââââââââââââââââââââââââââ
function update_pvp()
 -- game over screen: allow restart
 if state == "game_over" then
  if btnp(4) then -- : reiniciar partida
   init_game()
  elseif btnp(5) then -- : reiniciar el rom
   run()
  end
  return
 end

 -- espera antes de mostrar "game over"
 if state == "game_over_wait" then
  end_timer += 1
  if end_timer > 2 * 30 then
   state = "game_over"
  end
  return
 end

 -- selecciÃ³n de carta
 if state == "card" then
  if btnp(2) then repeat sel_card=(sel_card-2)%4+1 until current().cards[sel_card].alive end
  if btnp(3) then repeat sel_card=(sel_card)%4+1 until current().cards[sel_card].alive end
  if btnp(4) then
   selected = current().cards[sel_card]
   state = "action"
   menu_idx = 1
  end

 -- selecciÃ³n de acciÃ³n
 elseif state == "action" then
  if btnp(0) then menu_idx = (menu_idx - 2) % #menu_opts + 1 end
  if btnp(1) then menu_idx = (menu_idx) % #menu_opts + 1 end
  if btnp(4) then
   local act = menu_opts[menu_idx]
   if act == "attack" then
    sel_target = 1
    while not opponent().cards[sel_target].alive do
     sel_target = (sel_target % 4) + 1
    end
    state = "attack_target"

   elseif act == "sacrifice" then
    clear_log()
    if #alive_cards(current()) <= 1 then
     log_add("can't sacrifice last")
    elseif selected.t == "f" then
     transfer_mode = "foam_sacrifice"
     transfer_step = 1
     sacrificial_foam = selected
     transfer_list = all_alive()
     sel_idx = 1
     state = "transfer"
    else
     sel_target = 1
     while sel_target == sel_card or not current().cards[sel_target].alive do
      sel_target = (sel_target % 4) + 1
     end
     state = "sacrifice_target"
    end

   else -- rest
    clear_log()
    log_add(pname(current_player) .. selected.t .. " rest")
    if selected.h == 1 then
     selected.h += 1
     log_add(pname(current_player) .. selected.t .. "+")
    end
    end_turn()
   end
  end

 -- selecciÃ³n de target de ataque
 elseif state == "attack_target" then
  local e = opponent().cards
  if btnp(2) then repeat sel_target = (sel_target - 2) % 4 + 1 until e[sel_target].alive end
  if btnp(3) then repeat sel_target = (sel_target) % 4 + 1 until e[sel_target].alive end
  if btnp(4) then
   local foam_dead = attack(selected, e[sel_target])
   if foam_dead and not win_check() then
    transfer_mode = "foam_death"
    killer_player = current_player
    transfer_step = 1
    transfer_list = all_alive()
    sel_idx = 1
    state = "transfer"
   else
    end_turn()
   end
  end

 -- selecciÃ³n de target de sacrificio
 elseif state == "sacrifice_target" then
  local a = current().cards
  if btnp(2) then repeat sel_target = (sel_target - 2) % 4 + 1 until sel_target != sel_card and a[sel_target].alive end
  if btnp(3) then repeat sel_target = (sel_target) % 4 + 1 until sel_target != sel_card and a[sel_target].alive end
  if btnp(4) then
   clear_log()
   local src = selected
   local dst = a[sel_target]
   if src.t == "p" then dst.h += 1 log_add(pname(current_player) .. dst.t .. "+")
   elseif src.t == "r" then dst.a += 1 log_add(pname(current_player) .. dst.t .. "+")
   elseif src.t == "s" then dst.c += 1 log_add(pname(current_player) .. dst.t .. "+") end
   src.alive = false
   reset_cursor()
   state = "card"
  end

 -- modo transfer
 elseif state == "transfer" then
  if transfer_step == 1 then
   if btnp(2) then repeat sel_idx = (sel_idx - 2) % #transfer_list + 1 until transfer_list[sel_idx] ~= sacrificial_foam end
   if btnp(3) then repeat sel_idx = (sel_idx) % #transfer_list + 1 until transfer_list[sel_idx] ~= sacrificial_foam end
   if btnp(4) then
    sel_from = transfer_list[sel_idx]
    sel_cnts = {}
    if sel_from.h > 0 then add(sel_cnts, "h") end
    if sel_from.a > 0 then add(sel_cnts, "a") end
    if sel_from.c > 0 then add(sel_cnts, "c") end
    if #sel_cnts > 0 then
     sel_cnt_idx = 1
     transfer_step = 2
    else
     log_add("that card has nothing")
    end
   end

  elseif transfer_step == 2 then
   if btnp(0) then sel_cnt_idx = (sel_cnt_idx - 2) % #sel_cnts + 1 end
   if btnp(1) then sel_cnt_idx = (sel_cnt_idx) % #sel_cnts + 1 end
   if btnp(4) then
    sel_cnt = sel_cnts[sel_cnt_idx]
    local own = (transfer_mode == "foam_death") and killer_player or current_player
    to_list = {}
    for c in all(players[own].cards) do
     if c.alive and c ~= sacrificial_foam then add(to_list, c) end
    end
    sel_to_idx = 1
    transfer_step = 3
   end

  elseif transfer_step == 3 then
   if btnp(2) then sel_to_idx = (sel_to_idx - 2) % #to_list + 1 end
   if btnp(3) then sel_to_idx = (sel_to_idx) % #to_list + 1 end
   if btnp(4) then
    local to = to_list[sel_to_idx]
    if sel_cnt == "h" then sel_from.h -= 1 to.h += 1 if sel_from.h <= 0 then sel_from.alive = false end
    elseif sel_cnt == "a" then sel_from.a -= 1 to.a += 1
    else sel_from.c -= 1 to.c += 1 end
    local sym = sel_cnt == "h" and "" or sel_cnt == "a" and "" or ""
    log_add(pname(owner(sel_from)) .. "->" .. pname(owner(to)) .. " " .. sym)
    if sel_cnt == "h" and sel_from.h <= 0 then sel_from.alive = false end
    if win_check() then
     state = "game_over_wait"
     return
    end

    if transfer_mode == "foam_sacrifice" then
     sacrificial_foam.alive = false
     reset_cursor()
     state = "card"
    else
     state = "card"
     if win_check() then
      state = "game_over_wait"
      return
     end
     end_turn()
    end
    transfer_mode = nil
    menu_idx = 1
   end
  end
 end
end


---------------------------------
-- bot ai control section
-- contiene los dos tipos de bots: random y smart
-- se ejecutan segÃºn game_mode
---------------------------------

-- bot random: hace weas al azar pero espera un poquito pa no ser tan flaite
function update_bot_random()
 -- si no es el turno del bot, salimos altiro
 if current_player == 1 or state=="game_over_wait" or state=="game_over" then update_pvp() return end

 -- delay pa que el bot parezca que piensa (es pa la finta nomÃ¡s)
 bot_timer += 1
 if bot_timer < 30 then return end
 bot_timer = 0

 -- paso 0: elegir carta y acciÃ³n random
 if bot_step == 0 then
  local bot = current()
  local alive = alive_cards(bot)
  selected = alive[flr(rnd(#alive))+1]
  state = "action"
  menu_idx = flr(rnd(3))+1
  bot_step = 1
  return
 end

 -- paso 1: decidir quÃ© hacer con la acciÃ³n seleccionada
 if bot_step == 1 then
  local act = menu_opts[menu_idx]

  if act == "attack" then
    local enemy_cards = alive_cards(opponent())
    if #enemy_cards > 0 then
      repeat sel_target = flr(rnd(4))+1 until opponent().cards[sel_target].alive
      state = "attack_target"
      bot_step = 2
    else
      bot_step = 0 -- si no hay targets, vuelve a elegir
    end

  elseif act == "sacrifice" then
    if #alive_cards(current()) <= 1 then
      bot_step = 0 -- no puede sacrificarse solo, vuelve a elegir
    elseif selected.t == "f" then
      -- sacrificio de foam
      transfer_mode="foam_sacrifice"
      transfer_step=1
      sacrificial_foam=selected
      transfer_list=all_alive()
      sel_idx=1
      state="transfer"
      bot_step = 0
    else
      -- sacrificar a otro
      repeat sel_target = flr(rnd(4))+1 until sel_target ~= sel_card and current().cards[sel_target].alive
      state = "sacrifice_target"
      bot_step = 2
    end

  else -- rest
    clear_log()
    log_add(pname(current_player)..selected.t.." rest")
    if selected.h==1 then selected.h+=1 log_add(pname(current_player)..selected.t.."+") end
    bot_step = 3
  end
  return
 end

 -- paso 2: ejecutar ataque o sacrificio
 if bot_step == 2 then
  if state == "attack_target" then
    attack(selected, opponent().cards[sel_target])
    bot_step = 3
  elseif state == "sacrifice_target" then
    local src=selected
    local dst=current().cards[sel_target]
    clear_log()
    if src.t=="p" then dst.h+=1 log_add(pname(current_player)..dst.t.."+")
    elseif src.t=="r" then dst.a+=1 log_add(pname(current_player)..dst.t.."+")
    elseif src.t=="s" then dst.c+=1 log_add(pname(current_player)..dst.t.."+") end
    src.alive=false
    reset_cursor()
    state="card"
    bot_step = 3
  end
  return
 end

 -- paso 3: fin de turno
 if bot_step == 3 then
  end_turn()
  bot_step = 0
  return
 end
end

function update_bot_smart()
 -- si no es su turno o ya terminÃ³ el juego, chao
 if current_player == 1 or state=="game_over_wait" or state=="game_over" then update_pvp() return end

 -- delay pa disimular el ai pobre
 bot_timer += 1
 if bot_timer < 30 then return end
 bot_timer = 0

 -- paso 0: pensar quÃ© carta usar
 if bot_step == 0 then
  local bot = current()
  local alive = alive_cards(bot)

  -- tratar de matar a alguien directo
  for c in all(alive) do
   for ec in all(alive_cards(opponent())) do
    if dmg_vs(c, ec) >= ec.h then
     selected = c
     sel_target = card_index(opponent(), ec)
     state = "attack_target"
     bot_step = 2
     return
    end
   end
  end

  -- si no mata, ver si puede daÃ±ar
  for c in all(alive) do
   for ec in all(alive_cards(opponent())) do
    if dmg_vs(c, ec) > 0 then
     selected = c
     sel_target = card_index(opponent(), ec)
     state = "attack_target"
     bot_step = 2
     return
    end
   end
  end

  -- si no puede pegar, ver si alguna carta necesita "rest"
  for c in all(alive) do
   if c.h == 1 then
    selected = c
    state = "action"
    menu_idx = 3 -- rest
    bot_step = 1
    return
   end
  end

  -- si nada de eso sirve, sacrificar a alguien (si puede)
  if #alive > 1 then
   for c in all(alive) do
    if c.t ~= "f" then
     selected = c
     state = "sacrifice_target"
     repeat sel_target = flr(rnd(4)) + 1 until current().cards[sel_target].alive and current().cards[sel_target] ~= c
     bot_step = 2
     return
    end
   end
  end

  -- si ya no queda nada decente que hacer, hace rest random
  selected = alive[flr(rnd(#alive)) + 1]
  state = "action"
  menu_idx = 3
  bot_step = 1
  return
 end

 -- paso 1: ejecutar el rest
 if bot_step == 1 then
  clear_log()
  log_add(pname(current_player)..selected.t.." rest")
  if selected.h == 1 then selected.h += 1 log_add(pname(current_player)..selected.t.."+") end
  bot_step = 3
  return
 end

 -- paso 2: atacar o sacrificar
 if bot_step == 2 then
  if state == "attack_target" then
   attack(selected, opponent().cards[sel_target])
   bot_step = 3
  elseif state == "sacrifice_target" then
   local src = selected
   local dst = current().cards[sel_target]
   clear_log()
   if src.t=="p" then dst.h+=1 log_add(pname(current_player)..dst.t.."+")
   elseif src.t=="r" then dst.a+=1 log_add(pname(current_player)..dst.t.."+")
   elseif src.t=="s" then dst.c+=1 log_add(pname(current_player)..dst.t.."+") end
   src.alive=false
   reset_cursor()
   state="card"
   bot_step = 3
  end
  return
 end

 -- paso 3: fin de turno
 if bot_step == 3 then
  end_turn()
  bot_step = 0
  return
 end
end

-- funciÃ³n extra usada por el bot pa pillar el Ã­ndice de una carta
function card_index(p, c)
 for i=1,4 do
  if p.cards[i]==c then return i end
 end
 return 1 -- fallback por si acaso
end












custom_step = 1 -- 1:heart 2:atk 3:cut 4:mode
custom_mode_idx = 1
custom_modes = {"pvp", "bot_random", "bot_smart"}

function update_custom_config()
 if btnp(2) then
  if custom_step == 1 then custom_hearts = max(-1, custom_hearts - 1)
  elseif custom_step == 2 then custom_attack = max(-1, custom_attack - 1)
  elseif custom_step == 3 then custom_cut = max(-1, custom_cut - 1)
  elseif custom_step == 4 then custom_mode_idx = (custom_mode_idx - 2) % #custom_modes + 1
  end
 end

 if btnp(3) then
  if custom_step == 1 then custom_hearts = min(3, custom_hearts + 1)
  elseif custom_step == 2 then custom_attack = min(3, custom_attack + 1)
  elseif custom_step == 3 then custom_cut = min(3, custom_cut + 1)
  elseif custom_step == 4 then custom_mode_idx = (custom_mode_idx) % #custom_modes + 1
  end
 end

 if btnp(4) then
  if custom_step < 4 then
   custom_step += 1
  else
   game_mode = custom_modes[custom_mode_idx]
   custom_mode_selected = true
   menu_state = "game"
   init_game()
  end
 end
end

function draw_custom_config()
 cls(0)
 print("custom setup", 40, 10, 7)
 if custom_step==1 then
  print("bonus  to all cards: "..custom_hearts, 10, 40, 11)
 elseif custom_step==2 then
  print("bonus  to all cards: "..custom_attack, 10, 40, 10)
 elseif custom_step==3 then
  print("bonus  to all cards: "..custom_cut, 10, 40, 8)
 elseif custom_step==4 then
  print("choose mode:", 10, 40, 7)
  print("> "..custom_modes[custom_mode_idx], 10, 50, 6)
 end
 print(" to confirm   to change", 10, 100, 5)
end

function get_custom_key()
 return custom_step==1 and "hearts"
     or custom_step==2 and "attack"
     or "cut"
end



float_syms = {}
for i=1,20 do
 add(float_syms, {
sym=({"","",""})[flr(rnd(3))+1],
  x=rnd(128),
  y=rnd(128),
  dx=rnd(0.3)-0.15,
  dy=rnd(0.3)-0.15,
  c=function(s)
   return s=="" and 11 or s=="" and 10 or 8
  end
 })
end


function draw_float_syms()
 for s in all(float_syms) do
  print(s.sym, s.x, s.y, s.c(s.sym))
  s.x += s.dx
  s.y += s.dy
  if s.x < 0 or s.x > 120 then s.dx = -s.dx end
  if s.y < 0 or s.y > 120 then s.dy = -s.dy end
 end
end
