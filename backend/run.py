from app import create_app

app = create_app()

if __name__ == '__main__':
    print("==================================================================")
    print(" CineMind: Personalised Movie Decision Intelligence Platform API ")
    print(" Running on http://127.0.0.1:5000                                 ")
    print(" Default Admin: admin@cinemind.com / Admin@12345                 ")
    print(" Default Viewer: viewer@cinemind.com / Viewer@12345              ")
    print("==================================================================")
    app.run(host='0.0.0.0', port=5000, debug=False)
