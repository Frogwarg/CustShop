namespace DevAPI.Exceptions
{
    public class UnauthorizedException: Exception
    {
        public UnauthorizedException() : base() { }
        public UnauthorizedException(string message) : base(message) { }
        public UnauthorizedException(string message, Exception inner) : base(message, inner) { }
    }
}
