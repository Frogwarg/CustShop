using Npgsql;

namespace DevAPI.Data
{
    public class ConnectionStringSelector
    {
        private readonly IConfiguration _configuration;
        private string _cachedConnectionString;

        public ConnectionStringSelector(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GetConnectionString()
        {
            if (_cachedConnectionString != null)
                return _cachedConnectionString;

            // Пробуем Direct Connection
            string directConnection = _configuration.GetConnectionString("DirectConnection");
            if (TryConnect(directConnection))
            {
                Console.WriteLine("Using Direct Connection");
                _cachedConnectionString = directConnection;
                return directConnection;
            }

            // Пробуем Session Pooler
            string poolerConnection = _configuration.GetConnectionString("SessionPoolerConnection");
            if (TryConnect(poolerConnection))
            {
                Console.WriteLine("Using Session Pooler Connection");
                _cachedConnectionString = poolerConnection;
                return poolerConnection;
            }

            throw new InvalidOperationException("Unable to connect to the database using either Direct Connection or Session Pooler.");
        }

        private bool TryConnect(string connectionString)
        {
            try
            {
                using var conn = new NpgsqlConnection(connectionString);
                conn.Open();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
