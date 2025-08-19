// 환경 변수 설정
const config = {
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'youhyun',
    password: process.env.DB_PASSWORD || '48081486!',
    name: process.env.DB_NAME || 'little_todakdb',
    port: process.env.DB_PORT || 3306
  },
  
  // Vector Database Configuration
  vectorDB: {
    qdrantPath: process.env.QDRANT_PATH || './search-engine-py/my_local_qdrant_db',
    collectionName: process.env.COLLECTION_NAME || 'my_journal_on_disk'
  },
  
  // Python Script Configuration
  python: {
    path: process.env.PYTHON_PATH || 'python3'
  },
  
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  }
};

module.exports = config;
