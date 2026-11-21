import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Buffer } from 'buffer';
import '@/index.css';
import { Providers } from '@/components/Providers.jsx';
import SiteLayout from '@/components/layout/SiteLayout';
import AccountSignin from '@/components/account_signin/Component';

window.Buffer = window.Buffer || Buffer;

ReactDOM.createRoot(document.getElementById('root')).render(
  <Providers>
    <BrowserRouter>
      <SiteLayout>
        <AccountSignin />
      </SiteLayout>
    </BrowserRouter>
  </Providers>,
);
