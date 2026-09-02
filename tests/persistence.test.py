import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:',isolation_level=None)
db.execute('PRAGMA foreign_keys=ON')
for migration in sorted((root/'drizzle').glob('*.sql')): db.executescript(migration.read_text(encoding='utf-8'))
def fail(sql,args,expected):
 try: db.execute(sql,args)
 except sqlite3.IntegrityError as error: assert expected in str(error),(expected,str(error))
 else: raise AssertionError('Expected rejection: '+expected)
for tenant in ['account-a','account-b']: db.execute('INSERT INTO companies (id,name,mode,version) VALUES (?,?,?,1)',(tenant,'Teste','customer'))
for tenant,cid in [('account-a','client-a'),('account-b','client-b')]:db.execute('INSERT INTO customers(id,tenant,name,phone,created_at) VALUES (?,?,?,?,?)',(cid,tenant,'Teste','11999999999','2026-09-02'))
fail('INSERT INTO customers(id,tenant,name,phone,created_at) VALUES (?,?,?,?,?)',('duplicate','account-a','Teste','11999999999','2026-09-02'),'UNIQUE')
order_sql='INSERT INTO orders(id,tenant,customer_id,service,description,measurements,responsible,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
fail(order_sql,('wrong-order','account-a','client-b','Box','Pedido','','','Novo','2026-09-02','2026-09-02'),'FOREIGN KEY')
db.execute(order_sql,('order-a','account-a','client-a','Box','Pedido','','','Novo','2026-09-02','2026-09-02'))
assert db.execute('SELECT count(*) FROM orders WHERE tenant=?',('account-b',)).fetchone()[0]==0
book_sql='INSERT INTO bookings(id,tenant,customer_id,date,time,start_minute,duration,kind,location,status) VALUES (?,?,?,?,?,?,?,?,?,?)'
db.execute(book_sql,('booking-a','account-a','client-a','2026-09-02','09:00',540,60,'Medição','customer','Pendente'))
fail(book_sql,('overlap','account-a','client-a','2026-09-02','09:30',570,30,'Medição','customer','Pendente'),'booking_overlap')
db.execute(book_sql,('adjacent','account-a','client-a','2026-09-02','10:00',600,30,'Medição','customer','Pendente'))
db.execute(book_sql,('other-company','account-b','client-b','2026-09-02','09:00',540,60,'Medição','customer','Pendente'))
fail('UPDATE bookings SET start_minute=570,time=? WHERE id=?',('09:30','adjacent'),'booking_overlap')
db.execute("UPDATE bookings SET status='Cancelado' WHERE id='booking-a'")
db.execute(book_sql,('replacement','account-a','client-a','2026-09-02','09:00',540,60,'Medição','customer','Pendente'))
assert db.execute('UPDATE customers SET name=?,version=version+1 WHERE id=? AND tenant=? AND version=?',('Novo nome','client-a','account-a',1)).rowcount==1
assert db.execute('UPDATE customers SET name=?,version=version+1 WHERE id=? AND tenant=? AND version=?',('Nome antigo','client-a','account-a',1)).rowcount==0
assert db.execute('UPDATE customers SET name=? WHERE id=? AND tenant=?',('Invasão','client-a','account-b')).rowcount==0
photo_sql='INSERT INTO photos VALUES (?,?,?,?,?,?,?,?)'
for i in range(5):db.execute(photo_sql,(str(i),'account-a','order-a','key'+str(i),'foto.png','image/png',100,'2026-09-02'))
fail(photo_sql,('sixth','account-a','order-a','key6','foto.png','image/png',100,'2026-09-02'),'photo_limit')
assert db.execute('SELECT count(*) FROM audit WHERE tenant=?',('account-a',)).fetchone()[0]>=10
assert not db.execute('PRAGMA foreign_key_check').fetchall()
print('Migração, isolamento, duplicidade, concorrência de agenda, versões, limite de fotos e auditoria: OK')
