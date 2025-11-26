# Setup script for inference service (Windows)
# This script properly installs PyTorch on Windows to avoid DLL errors

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setting up Textile Cone Inspector" -ForegroundColor Cyan
Write-Host "Inference Service (Windows)" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path models | Out-Null
New-Item -ItemType Directory -Force -Path reference_images\green | Out-Null
New-Item -ItemType Directory -Force -Path reference_images\brown | Out-Null
New-Item -ItemType Directory -Force -Path reference_images\beige | Out-Null
New-Item -ItemType Directory -Force -Path reference_images\striped | Out-Null
New-Item -ItemType Directory -Force -Path reference_images\white | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

# Create .env if it doesn't exist
if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✓ Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.example not found, skipping .env creation" -ForegroundColor Yellow
    }
}

# Check if virtual environment exists
if (-not (Test-Path venv\Scripts\python.exe)) {
    Write-Host ""
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies (excluding torch/torchvision for now)
Write-Host ""
Write-Host "Installing Python dependencies (excluding PyTorch)..." -ForegroundColor Yellow
pip install fastmcp>=0.1.0
pip install ultralytics>=8.0.0
pip install pillow>=10.0.0
pip install flask>=3.0.0
pip install flask-cors>=4.0.0
pip install python-dotenv==1.0.0

# Install PyTorch separately with Windows-compatible build
Write-Host ""
Write-Host "Installing PyTorch (CPU version) for Windows..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow
try {
    python -c "import torch; print('✓ PyTorch version:', torch.__version__)"
    python -c "from ultralytics import YOLO; print('✓ Ultralytics YOLO: OK')"
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "✓ Setup complete!" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "⚠️  Verification failed. Please check the error above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Place your best.pt model in the models/ directory" -ForegroundColor White
Write-Host "2. Add reference images to reference_images/<class>/ directories" -ForegroundColor White
Write-Host "3. Start the HTTP server: python http_server.py" -ForegroundColor White
Write-Host "   OR configure as MCP server in Kiro IDE" -ForegroundColor White
Write-Host ""

