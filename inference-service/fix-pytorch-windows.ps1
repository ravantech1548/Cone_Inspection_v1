# Fix PyTorch DLL Error on Windows
# This script reinstalls PyTorch with the correct Windows-compatible version

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Fixing PyTorch Installation" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "WARNING: Virtual environment not detected!" -ForegroundColor Yellow
    Write-Host "Please activate the virtual environment first:" -ForegroundColor Yellow
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host ""
    $activate = Read-Host "Would you like to activate it now? (Y/N)"
    if ($activate -eq "Y" -or $activate -eq "y") {
        & .\venv\Scripts\Activate.ps1
    } else {
        Write-Host "Exiting. Please activate venv and run this script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Step 1: Uninstalling existing PyTorch packages..." -ForegroundColor Yellow
pip uninstall -y torch torchvision torchaudio

Write-Host ""
Write-Host "Step 2: Installing PyTorch (CPU version) for Windows..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Install PyTorch CPU version (most compatible on Windows)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

Write-Host ""
Write-Host "Step 3: Verifying installation..." -ForegroundColor Yellow
python -c "import torch; print('PyTorch version:', torch.__version__)"
python -c "from ultralytics import YOLO; print('Ultralytics YOLO: OK')"

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "PyTorch installation fixed!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run: python http_server.py" -ForegroundColor Cyan

