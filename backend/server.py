import uvicorn
import multiprocessing

if __name__ == "__main__":
    multiprocessing.freeze_support()  # Required for Windows
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

