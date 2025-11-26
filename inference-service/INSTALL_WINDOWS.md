# Windows Installation Guide

## Fixing PyTorch DLL Error (WinError 1114)

If you encounter the error:
```
OSError: [WinError 1114] A dynamic link library (DLL) initialization routine failed.
```

This is a common issue on Windows. The solution is to install PyTorch from the official PyTorch index with compatible versions.

## Installation Steps

1. **Activate your virtual environment:**
   ```powershell
   cd C:\Cone_Inspection-main\inference-service
   .\venv\Scripts\Activate.ps1
   ```

2. **Uninstall existing PyTorch (if installed):**
   ```powershell
   pip uninstall -y torch torchvision torchaudio
   ```

3. **Install PyTorch with compatible versions:**
   ```powershell
   pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cpu
   ```

4. **Fix NumPy compatibility:**
   ```powershell
   pip install "numpy<2"
   ```

5. **Install remaining dependencies:**
   ```powershell
   pip install fastmcp>=0.1.0
   pip install ultralytics>=8.0.0
   pip install pillow>=10.0.0
   pip install flask>=3.0.0
   pip install flask-cors>=4.0.0
   pip install python-dotenv==1.0.0
   ```

6. **Verify installation:**
   ```powershell
   python -c "import torch; print('PyTorch:', torch.__version__)"
   python -c "from ultralytics import YOLO; print('YOLO: OK')"
   ```

## Quick Fix Script

You can also use the provided fix script:
```powershell
.\fix-pytorch-windows.ps1
```

## Why This Works

- PyTorch 2.9.1+ has DLL compatibility issues on some Windows systems
- PyTorch 2.0.1 is more stable and compatible
- NumPy 2.x is incompatible with older PyTorch versions
- Installing from the official PyTorch index ensures correct Windows builds

## Alternative: Use setup-windows.ps1

For a fresh installation, use:
```powershell
.\setup-windows.ps1
```

This script handles all the installation steps automatically.

