﻿namespace DevAPI.Models.DTOs
{
    public class DesignUpdateDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string PreviewUrl { get; set; }
        public string DesignData { get; set; }
        public string DesignHash { get; set; }
        public string ProductType { get; set; }
    }
    public class UpdateDesignRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string ModerationStatus { get; set; }
        public string ModeratorComment { get; set; }
    }
}
