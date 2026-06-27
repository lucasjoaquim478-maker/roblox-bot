param($tasks = '[]', $loop = 'false')

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;
public class WinAPI {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
  [DllImport("user32.dll")] public static extern int ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

$MOUSEEVENTF_LEFTDOWN = 0x02
$MOUSEEVENTF_LEFTUP = 0x04
$KEYEVENTF_KEYDOWN = 0x00
$KEYEVENTF_KEYUP = 0x02

function Click-Mouse($x, $y) {
  [WinAPI]::SetCursorPos($x, $y)
  Start-Sleep -Milliseconds 50
  [WinAPI]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
  Start-Sleep -Milliseconds 50
  [WinAPI]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
  Write-Host "Click em ($x, $y)"
}

function Move-Mouse($x, $y) {
  [WinAPI]::SetCursorPos($x, $y)
  Write-Host "Mouse movido para ($x, $y)"
}

function Press-Key($key) {
  $keyMap = @{
    'enter'      = 0x0D; 'space'      = 0x20; 'tab'        = 0x09
    'escape'     = 0x1B; 'backspace'  = 0x08; 'shift'      = 0x10
    'ctrl'       = 0x11; 'alt'        = 0x12; 'up'         = 0x26
    'down'       = 0x28; 'left'       = 0x25; 'right'      = 0x27
    'f1'         = 0x70; 'f2'         = 0x71; 'f3'         = 0x72
    'f4'         = 0x73; 'f5'         = 0x74; 'f6'         = 0x75
    'f7'         = 0x76; 'f8'         = 0x77; 'f9'         = 0x78
    'f10'        = 0x79; 'f11'        = 0x7A; 'f12'        = 0x7B
    '1'          = 0x30; '2'          = 0x31; '3'          = 0x32
    '4'          = 0x33; '5'          = 0x34; '6'          = 0x35
    '7'          = 0x36; '8'          = 0x37; '9'          = 0x38
    '0'          = 0x39; 'a'          = 0x41; 'b'          = 0x42
    'c'          = 0x43; 'd'          = 0x44; 'e'          = 0x45
    'f'          = 0x46; 'g'          = 0x47; 'h'          = 0x48
    'i'          = 0x49; 'j'          = 0x4A; 'k'          = 0x4B
    'l'          = 0x4C; 'm'          = 0x4D; 'n'          = 0x4E
    'o'          = 0x4F; 'p'          = 0x50; 'q'          = 0x51
    'r'          = 0x52; 's'          = 0x53; 't'          = 0x54
    'u'          = 0x55; 'v'          = 0x56; 'w'          = 0x57
    'x'          = 0x58; 'y'          = 0x59; 'z'          = 0x5A
  }

  $vk = 0
  if ($keyMap.ContainsKey($key.ToLower())) {
    $vk = $keyMap[$key.ToLower()]
  } elseif ($key.Length -eq 1) {
    $vk = [int][char]($key.ToUpper())
  } else {
    Write-Host "Tecla desconhecida: $key"
    return
  }

  [WinAPI]::keybd_event($vk, 0, $KEYEVENTF_KEYDOWN, 0)
  Start-Sleep -Milliseconds 50
  [WinAPI]::keybd_event($vk, 0, $KEYEVENTF_KEYUP, 0)
  Write-Host "Tecla: $key"
}

function Type-Text($text) {
  $shell = New-Object -ComObject WScript.Shell
  $shell.SendKeys($text)
  Write-Host "Texto digitado: $text"
}

function Scroll-Mouse($amount) {
  [WinAPI]::mouse_event(0x0800, 0, 0, $amount, 0)
  Write-Host "Scroll: $amount"
}

function Wait-Ms($ms) {
  Start-Sleep -Milliseconds $ms
}

function Focus-RobloxWindow() {
  $hwnd = [WinAPI]::FindWindow([NullString]::Value, "Roblox")
  if ($hwnd -eq [IntPtr]::Zero) {
    $hwnd = [WinAPI]::FindWindow([NullString]::Value, "Roblox Player")
  }
  if ($hwnd -ne [IntPtr]::Zero) {
    [WinAPI]::ShowWindow($hwnd, 1)
    [WinAPI]::SetForegroundWindow($hwnd)
    Write-Host "Janela Roblox encontrada e ativada"
    Start-Sleep -Milliseconds 300
    return $true
  }
  Write-Host "Janela Roblox não encontrada"
  return $false
}

function Get-MousePosition() {
  $pos = [System.Windows.Forms.Cursor]::Position
  return @{ x = $pos.X; y = $pos.Y }
}

function Do-Login($user, $pass) {
  Write-Host "Iniciando login com usuario: $user"
  Start-Sleep -Milliseconds 3000

  $shell = New-Object -ComObject WScript.Shell

  for ($i = 0; $i -lt 8; $i++) { $shell.SendKeys("{TAB}"); Start-Sleep -Milliseconds 300 }
  Start-Sleep -Milliseconds 500

  $shell.SendKeys($user)
  Start-Sleep -Milliseconds 500
  $shell.SendKeys("{TAB}")
  Start-Sleep -Milliseconds 500
  $shell.SendKeys($pass)
  Start-Sleep -Milliseconds 500
  $shell.SendKeys("{ENTER}")

  Write-Host "Login enviado! Aguardando autenticacao..."
  Start-Sleep -Milliseconds 5000
  Write-Host "Login concluido (verifique se entrou)"
}

Write-Host "Bot Roblox iniciado"
$taskList = $tasks | ConvertFrom-Json
$doLoop = $loop -eq 'true'
$repeat = $true

while ($repeat) {
  Focus-RobloxWindow

  foreach ($task in $taskList) {
    $type = $task.type
    Write-Host "Executando: $type"

    switch ($type) {
      'click'    { Click-Mouse $task.x $task.y }
      'move'     { Move-Mouse $task.x $task.y }
      'key'      { Press-Key $task.key }
      'type'     { Type-Text $task.text }
      'wait'     { Wait-Ms $task.ms }
      'scroll'   { Scroll-Mouse $task.amount }
      'focus'    { Focus-RobloxWindow }
      'open'     { Start-Process $task.url; Write-Host "Abrindo URL: $($task.url)"; Start-Sleep -Milliseconds 2000 }
      'login'    { Do-Login $task.user $task.pass }
      default    { Write-Host "Tarefa desconhecida: $type" }
    }

    Start-Sleep -Milliseconds 100
  }

  $repeat = $doLoop
  if ($doLoop) { Write-Host "--- Repetindo loop ---" }
}

Write-Host "Bot finalizado"
