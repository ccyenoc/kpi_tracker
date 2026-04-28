import { Search, Bell } from 'lucide-react';

export default function Header({ title }) {
  return (
    <header className="d-flex justify-content-between align-items-center px-4 border-bottom bg-white"
      style={{ height: '64px' }}>

      <h5 className="m-0">{title}</h5>

      <div className="d-flex align-items-center gap-3">
        <Search />
        <Bell />
        <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
          style={{ width: 40, height: 40 }}>
          JS
        </div>
      </div>
    </header>
  );
}