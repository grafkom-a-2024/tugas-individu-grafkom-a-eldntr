# Membuat Objek Geometry
Disini saya menggambar berbagai bentuk geometri yakni, kubus, kerucut, dan silinder yang memiliki kontrol untuk melakukan translasi, skala, dan rotasi. Untuk membuat kubus, saya mendefinisikan 8 vertex dan 12 segitiga untuk sisi depan, belakang, kiri, kanan, atas, dan bawah. Lalu kerucut, dengan membuat satu puncak, dan beberapa vertex pada alas, dan segitiga yang membentuk sisi serta alas kerucut. Dan silinder, dengan membentuk dua lingkaran yang dihubungkan oleh segitiga untuk sisi melingkar.

## Hasil

![image](https://github.com/user-attachments/assets/c43a715f-9c3b-4e97-9360-670401b7b30f)

# Membuat Objek Lathe

Pada kode tersebut saya membuat bowling pin yang dapat translasi, skala dan rotasi, serta memiliki tekstur dan pencahayaan yang bisa diatur, beserta tipe kamera yakni perspektif dan ortografik. Objek tersebut dibuat dengan teknik lathe, yakni membuat objek 3D dengan memutar sebuah profil 2D. Pembuatan tersebut dengan fungsi SVG Path:Titik-titik yang menggambarkan bentuk dari object, Lathe Function(lathePoints): Memutar profil 2D dalam sumbu Y dan membuat objek 3D dengan menghitung posisi vertex, texcoords, serta index untuk menggambar mesh; dan generateMesh: memproses profil 2D lalu menghasilkan objek 3D berupa array posisi vertex, koordinat tekstur, dan normal untuk penerangan. 

Penerapan tekstur menggunakan fungsi `loadImageAndCreateTextureInfo`, dimana gambar tekstur akan di load dan diterapkan pada objek 3D dengan bantuan `textcoord` (koordinat tekstur). Dalam hal ini, Vertex shader akan mengatur posisi setiap vertex dan menghitung pencahayaan begitu juga Fragment Shader yang menghitung warna akhir setiap fragmen dan menggabungkan pencahayaan dan tekstur. Lalu, pencahayaan menggunakan uniform seperti u_lightWorldPosition, u_lightColor, u_lightIntensity, dan u_ambientLight digunakan untuk mengontrol posisi, warna, dan intensitas cahaya di dalam shader.

Agar animasi object berjalan, translasi dan skala dilakukan dengan kontrol input pada html memanipulasi varibel lalu nilainya digunakan untuk matrix transformasi dalam fungsi render dan rotasi dengan memanipulasi `worldMatrix` dengan menggunakan kontrol mouse yang perubahan posisinya diterjemahkan menjadi rotasi pada sumbu X dan Y.

Untuk membuat kamera perspektif, menggunakan fungsi `m4.perspective` dan untuk kamera orthograpic menggunakan `m4.orthograhic`.

## Hasil

![image](https://github.com/user-attachments/assets/2f225951-9fdb-45bc-90c6-ce93a366999e)

Perspektif vs Othogonal dengan skala dan pengaturan yang sama:
![image](https://github.com/user-attachments/assets/06ecf666-ed4c-4c3d-a14b-45b6e3c71190)


---

*Untuk menjalankan kode, dapat menggunakan liveserver dikarenakan terdapat CORS untuk mengakses tektur gambar*
- Eldintaro Farrandi 5025221299
