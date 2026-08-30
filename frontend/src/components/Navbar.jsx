import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Glamour Closet
        </Link>
        <nav className="navbar-links">
          <NavLink
            to="/wardrobe"
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            Garderobe
          </NavLink>
          <NavLink
            to="/outfits"
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            Outfits
          </NavLink>
          <NavLink
            to="/imprint"
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            Impressum
          </NavLink>
          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            Datenschutz
          </NavLink>
          {user ? (
            <>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `nav-link${isActive ? ' nav-link-active' : ''}`
                }
              >
                Konto
              </NavLink>
              <button type="button" className="nav-logout" onClick={handleLogout}>
                Abmelden
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link-active' : ''}`
              }
            >
              Anmelden
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
