import JSZip from 'jszip';
import { InvestigationProject } from '../types/osint';

export async function downloadPythonZip(project?: InvestigationProject): Promise<void> {
  const zip = new JSZip();

  // Root launcher and scripts
  zip.file('main.py', `#!/usr/bin/env python3
import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from python_app.main import main

if __name__ == "__main__":
    main()
`);

  zip.file('run_windows.bat', `@echo off
chcp 65001 >nul
title OsintDesk Python GUI
echo OsintDesk baslatiliyor...
python main.py
if %ERRORLEVEL% neq 0 (
    py main.py
)
pause
`);

  zip.file('run_linux.sh', `#!/usr/bin/env bash
set -e
echo "OsintDesk Linux GUI baslatiliyor..."
if ! python3 -c "import tkinter" &> /dev/null; then
    echo "Lutfen tkinter yukleyin: sudo apt install python3-tk"
fi
python3 main.py
`);

  zip.file('requirements.txt', `pillow>=10.0.0\n`);

  zip.file('README.md', `# OsintDesk - Python Masaüstü GUI

Windows ve Linux uyumlu profesyonel OSINT ağ haritalama yazılımı.

## Windows Çalıştırma:
run_windows.bat dosyasına çift tıklayın veya:
\`\`\`bash
python main.py
\`\`\`

## Linux Çalıştırma:
\`\`\`bash
sudo apt install -y python3-tk
chmod +x run_linux.sh
./run_linux.sh
\`\`\`
`);

  // Include project JSON if available
  if (project) {
    zip.file('current_investigation.json', JSON.stringify(project, null, 2));
  }

  // Fetch the created python files directly or add key application modules
  const pythonFiles = [
    'models.py',
    'layouts.py',
    'storage.py',
    'graph_canvas.py',
    'dialogs.py',
    'sidebar.py',
    'ribbon.py',
    'main.py',
  ];

  const appFolder = zip.folder('python_app');
  if (appFolder) {
    for (const file of pythonFiles) {
      try {
        const resp = await fetch(`/python_app/${file}`);
        if (resp.ok) {
          const content = await resp.text();
          appFolder.file(file, content);
          continue;
        }
      } catch (e) {
        // Fallback below
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'OsintDesk-Python-Desktop-GUI.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
