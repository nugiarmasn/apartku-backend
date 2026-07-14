# Pakai mesin Python yang ringan
FROM python:3.10-slim

# Bikin folder kerja di dalam server
WORKDIR /code

# PENTING: Install program dasar C++ (cmake, g++) 
# Ini WAJIB buat nginstall library 'dlib' dan 'face-recognition' lu biar nggak error
RUN apt-get update && apt-get install -y cmake g++ make

# Copy file requirements dan install library-nya
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua file kode lu (folder app, dll)
COPY . .

# Jalankan server dari folder app/main.py di port 7860 (Port wajib Hugging Face)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]