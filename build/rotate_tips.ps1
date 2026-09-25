param(
  [IntPtr]$Hwnd = [IntPtr]::Zero,
  [IntPtr]$BtnHwnd = [IntPtr]::Zero
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32InstallerMsg {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam);
  [DllImport("user32.dll")]
  public static extern int SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
  [DllImport("user32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool IsWindow(IntPtr hWnd);
}
"@

$tips = @(
  "Developer message: I am a single developer behind this browser, so report any bugs in this Discord server:",
  "Tip: You can toggle the Play Disk widget from Settings for easy media access anytime!",
  "Tip: Faibilo automatically sleeps idle tabs to save CPU and RAM for lightning speed.",
  "Tip: Ephemeral Private Browsing keeps your history and permissions 100% temporary."
)

$tipIndex = 0
$lastClick = [DateTime]::MinValue

while ($Hwnd -ne [IntPtr]::Zero -and [Win32InstallerMsg]::IsWindow($Hwnd)) {
  for ($step = 0; $step -lt 40; $step++) {
    Start-Sleep -Milliseconds 100
    if (![Win32InstallerMsg]::IsWindow($Hwnd)) { exit 0 }

    if ($BtnHwnd -ne [IntPtr]::Zero) {
      $state = [Win32InstallerMsg]::SendMessage($BtnHwnd, 0x00F2, [IntPtr]::Zero, [IntPtr]::Zero)
      if (($state -band 4) -ne 0 -and ([DateTime]::UtcNow - $lastClick).TotalSeconds -gt 2) {
        $lastClick = [DateTime]::UtcNow
        Start-Process "https://discord.gg/YRhcgEGVjN"
      }
    }
  }

  if (![Win32InstallerMsg]::IsWindow($Hwnd)) { exit 0 }
  $tipIndex = ($tipIndex + 1) % $tips.Length
  [Win32InstallerMsg]::SendMessage($Hwnd, 0x000C, [IntPtr]::Zero, $tips[$tipIndex])
}
